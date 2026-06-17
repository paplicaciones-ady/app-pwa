import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'node:crypto';
import * as jwt from 'jsonwebtoken';
import { UsersService } from '../users/users.service';

interface OAuthState {
  redirectTo: string;
  redirectUri: string;
  createdAt: Date;
}

interface MicrosoftTokenResponse {
  id_token: string;
  access_token: string;
  refresh_token?: string;
}

interface MicrosoftUser {
  oid: string;
  email: string;
  name: string;
}

@Injectable()
export class MicrosoftAuthService {
  private readonly oauthStates = new Map<string, OAuthState>();
  private readonly STATE_TTL = 10 * 60 * 1000;

  private jwksCache: { keys: unknown[]; fetchedAt: number } | null = null;
  private readonly JWKS_CACHE_TTL = 24 * 60 * 60 * 1000;

  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly tenant: string;
  private readonly configRedirectUri: string;
  private readonly frontendUrl: string;
  private readonly encryptionKey: string;

  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {
    this.clientId = config.getOrThrow<string>('AZURE_CLIENT_ID');
    this.clientSecret = config.getOrThrow<string>('AZURE_CLIENT_SECRET');
    this.tenant = config.get<string>('AZURE_TENANT_ID') ?? 'common';
    this.configRedirectUri =
      config.get<string>('AZURE_REDIRECT_URI') ??
      'http://localhost:3000/api/auth/microsoft/callback';
    this.frontendUrl =
      config.get<string>('FRONTEND_URL') ?? 'http://localhost:4200';
    this.encryptionKey = config.getOrThrow<string>('AZURE_TOKEN_ENCRYPTION_KEY');
  }

  private resolveRedirectUri(origin?: string): string {
    if (origin) {
      const url = new URL(origin);
      return `${url.protocol}//${url.host}/api/auth/microsoft/callback`;
    }
    return this.configRedirectUri;
  }

  async generateLoginUrl(redirectTo?: string, origin?: string): Promise<{ url: string }> {
    this.cleanExpiredStates();

    const state = crypto.randomUUID();
    const redirectUri = this.resolveRedirectUri(origin);
    this.oauthStates.set(state, {
      redirectTo: redirectTo ?? this.frontendUrl,
      redirectUri,
      createdAt: new Date(),
    });

    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: 'openid profile email offline_access',
      state,
      response_mode: 'query',
    });

    return {
      url: `https://login.microsoftonline.com/${this.tenant}/oauth2/v2.0/authorize?${params}`,
    };
  }

  async handleCallback(
    code: string,
    state: string,
  ): Promise<{ redirectUrl: string }> {
    const stored = this.oauthStates.get(state);
    if (!stored) {
      throw new BadRequestException('Invalid or expired state');
    }
    this.oauthStates.delete(state);

    if (Date.now() - stored.createdAt.getTime() > this.STATE_TTL) {
      throw new BadRequestException('State expired');
    }

    const tokens = await this.exchangeCodeForTokens(code, stored.redirectUri);
    const microsoftUser = await this.validateIdToken(tokens.id_token);

    const user = await this.usersService.findOrCreateFromMicrosoft(
      microsoftUser.oid,
      microsoftUser.email,
      microsoftUser.name,
    );

    if (tokens.refresh_token) {
      user.microsoftRefreshToken = this.encryptToken(tokens.refresh_token);
      await this.usersService.save(user);
    }

    const appToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    const isNewUser =
      Math.abs(user.createdAt.getTime() - Date.now()) < 5000;

    const params = new URLSearchParams({
      token: appToken,
      isNewUser: String(isNewUser),
    });

    return {
      redirectUrl: `${stored.redirectTo}/auth/callback?${params}`,
    };
  }

  async refreshTokens(userId: number): Promise<boolean> {
    const user = await this.usersService.findById(userId);
    if (!user?.microsoftRefreshToken) return false;

    const decrypted = this.decryptToken(user.microsoftRefreshToken);

    const body = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: decrypted,
      grant_type: 'refresh_token',
      scope: 'openid profile email offline_access',
    });

    const res = await fetch(
      `https://login.microsoftonline.com/${this.tenant}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      },
    );

    if (!res.ok) {
      user.microsoftRefreshToken = undefined!;
      await this.usersService.save(user);
      return false;
    }

    const data = (await res.json()) as MicrosoftTokenResponse;
    if (data.refresh_token) {
      user.microsoftRefreshToken = this.encryptToken(data.refresh_token);
      await this.usersService.save(user);
    }

    return true;
  }

  private async exchangeCodeForTokens(
    code: string,
    redirectUri: string,
  ): Promise<MicrosoftTokenResponse> {
    const body = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const res = await fetch(
      `https://login.microsoftonline.com/${this.tenant}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new InternalServerErrorException(
        `Microsoft token exchange failed: ${text}`,
      );
    }

    return res.json() as Promise<MicrosoftTokenResponse>;
  }

  private async validateIdToken(idToken: string): Promise<MicrosoftUser> {
    const header = this.decodeJwtHeader(idToken);
    const keys = await this.getJwks();
    const jwk = keys.find((k: any) => k.kid === header.kid);
    if (!jwk) {
      throw new UnauthorizedException('No matching JWKS key found');
    }

    const publicKey = crypto.createPublicKey({ format: 'jwk', key: jwk as any });

    const expectedIssuer = `https://login.microsoftonline.com/${this.tenant}/v2.0`;

    let payload: Record<string, unknown>;
    try {
      payload = jwt.verify(idToken, publicKey, {
        algorithms: ['RS256'],
        audience: this.clientId,
        issuer: expectedIssuer,
      }) as Record<string, unknown>;
    } catch (err) {
      throw new UnauthorizedException(
        `Microsoft token validation failed: ${(err as Error).message}`,
      );
    }

    if (!payload.oid || !payload.email) {
      throw new UnauthorizedException(
        'Microsoft token missing required claims',
      );
    }

    return {
      oid: payload.oid as string,
      email: payload.email as string,
      name: (payload.name as string) ?? (payload.email as string),
    };
  }

  private decodeJwtHeader(token: string): { kid: string; alg: string } {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('Invalid JWT format');
    }
    return JSON.parse(
      Buffer.from(parts[0], 'base64url').toString('utf-8'),
    );
  }

  private async getJwks(): Promise<unknown[]> {
    if (
      this.jwksCache &&
      Date.now() - this.jwksCache.fetchedAt < this.JWKS_CACHE_TTL
    ) {
      return this.jwksCache.keys;
    }

    const res = await fetch(
      `https://login.microsoftonline.com/${this.tenant}/discovery/v2.0/keys`,
    );

    if (!res.ok) {
      throw new InternalServerErrorException('Failed to fetch Microsoft JWKS');
    }

    const data = (await res.json()) as { keys: unknown[] };
    this.jwksCache = { keys: data.keys, fetchedAt: Date.now() };
    return data.keys;
  }

  private encryptToken(plaintext: string): string {
    const key = this.deriveKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf-8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('base64')}:${encrypted.toString('base64')}:${authTag.toString('base64')}`;
  }

  private decryptToken(encoded: string): string {
    const parts = encoded.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted token format');
    }

    const key = this.deriveKey();
    const iv = Buffer.from(parts[0], 'base64');
    const encrypted = Buffer.from(parts[1], 'base64');
    const authTag = Buffer.from(parts[2], 'base64');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(encrypted) + decipher.final('utf-8');
  }

  private deriveKey(): Buffer {
    return crypto.scryptSync(this.encryptionKey, 'microsoft-token-salt', 32);
  }

  private cleanExpiredStates(): void {
    const now = Date.now();
    for (const [key, value] of this.oauthStates) {
      if (now - value.createdAt.getTime() > this.STATE_TTL) {
        this.oauthStates.delete(key);
      }
    }
  }
}
