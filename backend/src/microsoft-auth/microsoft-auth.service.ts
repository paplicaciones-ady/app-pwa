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
    console.log('[Microsoft Service] generateLoginUrl()');
    console.log('[Microsoft Service]   origin:', origin);
    console.log('[Microsoft Service]   redirectTo param:', redirectTo);

    this.cleanExpiredStates();

    const state = crypto.randomUUID();
    const redirectUri = this.resolveRedirectUri(origin);
    const resolvedFrontendUrl = origin ?? 'http://localhost:4200';
    console.log('[Microsoft Service]   redirectUri resuelto:', redirectUri);
    console.log('[Microsoft Service]   resolvedFrontendUrl:', resolvedFrontendUrl);
    console.log('[Microsoft Service]   state:', state);

    this.oauthStates.set(state, {
      redirectTo: redirectTo ?? resolvedFrontendUrl,
      redirectUri,
      createdAt: new Date(),
    });
    console.log('[Microsoft Service]   OAuth state guardado, total states:', this.oauthStates.size);

    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: 'openid profile email offline_access',
      state,
      response_mode: 'query',
    });

    const url = `https://login.microsoftonline.com/${this.tenant}/oauth2/v2.0/authorize?${params}`;
    console.log('[Microsoft Service]   URL generada (primeros 120 chars):', url.slice(0, 120));
    return { url };
  }

  async handleCallback(
    code: string,
    state: string,
  ): Promise<{ redirectUrl: string }> {
    console.log('[Microsoft Service] handleCallback()');
    console.log('[Microsoft Service]   code presente:', !!code);
    console.log('[Microsoft Service]   state:', state);

    const stored = this.oauthStates.get(state);
    if (!stored) {
      console.error('[Microsoft Service]   ERROR: State no encontrado en el Map. States disponibles:',
        Array.from(this.oauthStates.keys()));
      throw new BadRequestException('Invalid or expired state');
    }
    console.log('[Microsoft Service]   State encontrado:', { ...stored });

    if (Date.now() - stored.createdAt.getTime() > this.STATE_TTL) {
      console.error('[Microsoft Service]   ERROR: State expirado');
      throw new BadRequestException('State expired');
    }
    console.log('[Microsoft Service]   State válido');

    console.log('[Microsoft Service]   Intercambiando código por tokens...');
    const tokens = await this.exchangeCodeForTokens(code, stored.redirectUri);
    console.log('[Microsoft Service]   Tokens obtenidos. id_token presente:', !!tokens.id_token);
    console.log('[Microsoft Service]   refresh_token presente:', !!tokens.refresh_token);

    console.log('[Microsoft Service]   Validando id_token...');
    const microsoftUser = await this.validateIdToken(tokens.id_token);
    console.log('[Microsoft Service]   Usuario Microsoft:', { ...microsoftUser });

    console.log('[Microsoft Service]   Buscando/creando usuario en BD...');
    const user = await this.usersService.findOrCreateFromMicrosoft(
      microsoftUser.oid,
      microsoftUser.email,
      microsoftUser.name,
    );
    console.log('[Microsoft Service]   Usuario local:', { id: user.id, email: user.email, name: user.name });

    if (tokens.refresh_token) {
      console.log('[Microsoft Service]   Encriptando y guardando refresh_token...');
      user.microsoftRefreshToken = this.encryptToken(tokens.refresh_token);
      await this.usersService.save(user);
      console.log('[Microsoft Service]   Refresh token guardado');
    }

    const appToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });
    console.log('[Microsoft Service]   App JWT generado (primeros 50 chars):', appToken.slice(0, 50));

    const isNewUser =
      Math.abs(user.createdAt.getTime() - Date.now()) < 5000;
    console.log('[Microsoft Service]   isNewUser:', isNewUser);

    this.oauthStates.delete(state);
    console.log('[Microsoft Service]   State eliminado del Map');

    const params = new URLSearchParams({
      token: appToken,
      isNewUser: String(isNewUser),
    });

    const redirectUrl = `${stored.redirectTo}/auth/callback?${params}`;
    console.log('[Microsoft Service]   redirectUrl FINAL:', redirectUrl);
    return { redirectUrl };
  }

  peekStateRedirectTo(state: string): string | null {
    console.log('[Microsoft Service] peekStateRedirectTo() state:', state);
    const stored = this.oauthStates.get(state);
    const result = stored?.redirectTo ?? null;
    console.log('[Microsoft Service]   resultado:', result);
    return result;
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
    console.log('[Microsoft Service]   exchangeCodeForTokens()');
    console.log('[Microsoft Service]     code presente:', !!code);
    console.log('[Microsoft Service]     redirectUri:', redirectUri);

    const body = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const tokenUrl = `https://login.microsoftonline.com/${this.tenant}/oauth2/v2.0/token`;
    console.log('[Microsoft Service]     POST a:', tokenUrl);

    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    console.log('[Microsoft Service]     Status de respuesta:', res.status);

    if (!res.ok) {
      const text = await res.text();
      console.error('[Microsoft Service]     ERROR en token exchange:', text);
      throw new InternalServerErrorException(
        `Microsoft token exchange failed: ${text}`,
      );
    }

    const data = await res.json() as MicrosoftTokenResponse;
    console.log('[Microsoft Service]     Token exchange exitoso');
    return data;
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
