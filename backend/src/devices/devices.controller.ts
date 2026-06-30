import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DevicesService } from './devices.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post('check')
  async checkFingerprint(
    @Body('fingerprint') fingerprint: string,
    @Body('legacyFingerprint') legacyFingerprint?: string,
  ) {
    let device = await this.devicesService.findByFingerprintPublic(fingerprint);
    let migrated = false;

    if (!device && legacyFingerprint) {
      device = await this.devicesService.findByFingerprintPublic(legacyFingerprint);
      if (device) {
        await this.devicesService.updateFingerprint(device.id, fingerprint);
        device.deviceFingerprint = fingerprint;
        migrated = true;
      }
    }

    if (!device) return { registered: false };
    const userId = device.user?.id;
    const hasPasskeys = userId ? (await this.devicesService.getPasskeyCount(userId)) > 0 : false;
    return {
      registered: true,
      deviceName: device.deviceName,
      isTrusted: device.isTrusted,
      hasPasskeys,
      migrated,
      userName: device.user?.name ?? null,
      userEmail: device.user?.email ?? null,
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async register(
    @Req() req: any,
    @Body('deviceName') deviceName: string,
    @Body('deviceFingerprint') deviceFingerprint: string,
  ) {
    return this.devicesService.create(
      req.user.id,
      deviceName,
      deviceFingerprint,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(@Req() req: any) {
    return this.devicesService.findByUser(req.user.id);
  }

  @Patch(':id/toggle-trust')
  @UseGuards(JwtAuthGuard)
  async toggleTrust(@Req() req: any, @Param('id') id: string) {
    return this.devicesService.toggleTrust(+id, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Req() req: any, @Param('id') id: string) {
    await this.devicesService.delete(+id, req.user.id);
    return { ok: true };
  }
}
