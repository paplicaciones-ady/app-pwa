import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from './device.entity';
import { PasskeyCredential } from '../passkeys/passkey.entity';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private readonly deviceRepo: Repository<Device>,
    @InjectRepository(PasskeyCredential)
    private readonly passkeyRepo: Repository<PasskeyCredential>,
  ) {}

  async create(
    userId: number,
    deviceName: string,
    deviceFingerprint: string,
  ): Promise<Device> {
    const device = this.deviceRepo.create({
      userId,
      deviceName,
      deviceFingerprint,
      isTrusted: true,
      lastUsedAt: new Date(),
    });
    return this.deviceRepo.save(device);
  }

  async findByUser(userId: number): Promise<Device[]> {
    return this.deviceRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByFingerprint(
    userId: number,
    fingerprint: string,
  ): Promise<Device | null> {
    return this.deviceRepo.findOne({
      where: { userId, deviceFingerprint: fingerprint },
    });
  }

  async findByFingerprintPublic(fingerprint: string): Promise<Device | null> {
    return this.deviceRepo.findOne({
      where: { deviceFingerprint: fingerprint },
      relations: { user: true },
    });
  }

  async getPasskeyCount(userId: number): Promise<number> {
    return this.passkeyRepo.count({ where: { userId } });
  }

  async findById(id: number): Promise<Device | null> {
    return this.deviceRepo.findOne({ where: { id } });
  }

  async updateLastUsed(id: number): Promise<void> {
    await this.deviceRepo.update(id, { lastUsedAt: new Date() });
  }

  async toggleTrust(id: number, userId: number): Promise<Device> {
    const device = await this.deviceRepo.findOne({ where: { id, userId } });
    if (!device) throw new NotFoundException('Device not found');
    device.isTrusted = !device.isTrusted;
    return this.deviceRepo.save(device);
  }

  async delete(id: number, userId: number): Promise<void> {
    const device = await this.deviceRepo.findOne({ where: { id, userId } });
    if (!device) throw new NotFoundException('Device not found');
    await this.deviceRepo.remove(device);
  }
}
