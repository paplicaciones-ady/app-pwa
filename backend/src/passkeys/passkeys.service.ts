import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { PasskeyCredential } from './passkey.entity';
import { UsersService } from '../users/users.service';
import { DevicesService } from '../devices/devices.service';

@Injectable()
export class PasskeysService {
  private readonly rpName = 'pwa-app';

  private readonly challenges = new Map<number, string>();
  private readonly loginChallenges = new Map<string, { challenge: string; userId: number }>();

  constructor(
    @InjectRepository(PasskeyCredential)
    private readonly passkeyRepo: Repository<PasskeyCredential>,
    private readonly usersService: UsersService,
    private readonly devicesService: DevicesService,
    private readonly jwtService: JwtService,
  ) {}

  private resolveRpId(origin?: string): string {
    if (origin) {
      return new URL(origin).hostname;
    }
    return process.env.RP_ID ?? 'localhost';
  }

  private resolveExpectedOrigin(origin?: string): string {
    return origin ?? process.env.EXPECTED_ORIGIN ?? 'http://localhost:4200';
  }

  async generateRegistrationOptions(userId: number, email: string, origin?: string) {
    const existing = await this.passkeyRepo.find({ where: { userId } });

    const options = await generateRegistrationOptions({
      rpName: this.rpName,
      rpID: this.resolveRpId(origin),
      userName: email,
      userDisplayName: email,
      attestationType: 'none',
      excludeCredentials: existing.map((cred) => ({
        id: cred.credentialId,
        type: 'public-key' as const,
        transports: cred.transports as AuthenticatorTransport[],
      })),
    });

    this.challenges.set(userId, options.challenge);

    return { publicKey: options };
  }

  async verifyRegistrationResponse(
    userId: number,
    credential: any,
    deviceId?: number,
    origin?: string,
  ) {
    const challenge = this.challenges.get(userId);
    if (!challenge) {
      throw new UnauthorizedException('No pending registration challenge');
    }

    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin: this.resolveExpectedOrigin(origin),
      expectedRPID: this.resolveRpId(origin),
    });

    if (!verification.verified || !verification.registrationInfo) {
      this.challenges.delete(userId);
      throw new UnauthorizedException('Registration verification failed');
    }

    const { credential: reg } = verification.registrationInfo;

    let deviceName: string | undefined;
    if (deviceId !== undefined) {
      const device = await this.devicesService.findById(deviceId);
      if (device && device.userId === userId) {
        deviceName = device.deviceName;
        await this.devicesService.updateLastUsed(device.id);
      }
    }

    const passkey = this.passkeyRepo.create({
      userId,
      credentialId: reg.id,
      publicKey: Buffer.from(reg.publicKey).toString('base64url'),
      counter: reg.counter,
      backedUp: verification.registrationInfo.credentialBackedUp,
      transports: credential.transports ?? [],
      ...(deviceId !== undefined && { deviceId }),
      ...(deviceName !== undefined && { deviceName }),
    });

    await this.passkeyRepo.save(passkey);
    this.challenges.delete(userId);

    return { ok: true };
  }

  async generateAuthenticationOptions(email: string, deviceFingerprint?: string, origin?: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    let deviceId: number | null = null;
    if (deviceFingerprint) {
      const device = await this.devicesService.findByFingerprint(user.id, deviceFingerprint);
      if (device) {
        deviceId = device.id;
      }
    }

    const passkeys = await this.passkeyRepo.find({ where: { userId: user.id } });
    if (passkeys.length === 0) {
      throw new UnauthorizedException('No passkeys registered for this user');
    }

    const options = await generateAuthenticationOptions({
      rpID: this.resolveRpId(origin),
      allowCredentials: passkeys.map((cred) => ({
        id: cred.credentialId,
        type: 'public-key' as const,
        transports: cred.transports as AuthenticatorTransport[],
      })),
      userVerification: 'preferred',
    });

    const sessionId = crypto.randomUUID();
    this.loginChallenges.set(sessionId, {
      challenge: options.challenge,
      userId: user.id,
    });

    return { sessionId, publicKey: options, deviceId };
  }

  async verifyAuthenticationResponse(sessionId: string, credential: any, origin?: string) {
    const challengeData = this.loginChallenges.get(sessionId);
    if (!challengeData) {
      throw new UnauthorizedException('No pending login challenge');
    }

    const storedCred = await this.passkeyRepo.findOne({
      where: { credentialId: credential.id },
    });
    if (!storedCred || storedCred.userId !== challengeData.userId) {
      this.loginChallenges.delete(sessionId);
      throw new UnauthorizedException('Invalid credential');
    }

    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: challengeData.challenge,
      expectedOrigin: this.resolveExpectedOrigin(origin),
      expectedRPID: this.resolveRpId(origin),
      credential: {
        id: storedCred.credentialId,
        publicKey: Buffer.from(storedCred.publicKey, 'base64url'),
        counter: storedCred.counter,
        transports: storedCred.transports as AuthenticatorTransport[],
      },
    });

    this.loginChallenges.delete(sessionId);

    if (!verification.verified || !verification.authenticationInfo) {
      throw new UnauthorizedException('Authentication verification failed');
    }

    await this.passkeyRepo.update(storedCred.id, {
      counter: verification.authenticationInfo.newCounter,
    });

    const user = await this.usersService.findById(storedCred.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const payload = { sub: user.id, email: user.email };
    return { access_token: this.jwtService.sign(payload) };
  }

  async findByUser(userId: number) {
    return this.passkeyRepo.find({
      where: { userId },
      select: {
        id: true,
        deviceName: true,
        deviceId: true,
        createdAt: true,
        backedUp: true,
        transports: true,
      },
    });
  }

  async deletePasskey(id: number, userId: number) {
    const passkey = await this.passkeyRepo.findOne({ where: { id } });
    if (!passkey) {
      throw new NotFoundException('Passkey not found');
    }
    if (passkey.userId !== userId) {
      throw new UnauthorizedException('Passkey does not belong to user');
    }
    await this.passkeyRepo.remove(passkey);
  }
}
