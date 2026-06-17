import {
  Controller,
  Get,
  Post,
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

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Req() req: any, @Param('id') id: string) {
    await this.devicesService.delete(+id, req.user.id);
    return { ok: true };
  }
}
