import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Req,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { PasskeysService } from './passkeys.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('auth/passkey')
export class PasskeysController {
  constructor(private readonly passkeysService: PasskeysService) {}

  @Post('login/begin')
  async loginBegin(
    @Body('email') email: string,
    @Body('deviceFingerprint') deviceFingerprint?: string,
    @Headers('origin') origin?: string,
  ) {
    return this.passkeysService.generateAuthenticationOptions(email, deviceFingerprint, origin);
  }

  @Post('login/complete')
  async loginComplete(
    @Body('sessionId') sessionId: string,
    @Body('credential') credential: any,
    @Headers('origin') origin?: string,
  ) {
    return this.passkeysService.verifyAuthenticationResponse(sessionId, credential, origin);
  }

  @Post('register/begin')
  @UseGuards(JwtAuthGuard)
  async registerBegin(
    @Req() req: any,
    @Headers('origin') origin?: string,
  ) {
    return this.passkeysService.generateRegistrationOptions(
      req.user.id,
      req.user.email,
      origin,
    );
  }

  @Post('register/complete')
  @UseGuards(JwtAuthGuard)
  async registerComplete(
    @Req() req: any,
    @Body('credential') credential: any,
    @Body('deviceId') deviceId?: number,
    @Headers('origin') origin?: string,
  ) {
    return this.passkeysService.verifyRegistrationResponse(
      req.user.id,
      credential,
      deviceId,
      origin,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(@Req() req: any) {
    return this.passkeysService.findByUser(req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Req() req: any, @Param('id') id: string) {
    await this.passkeysService.deletePasskey(+id, req.user.id);
    return { ok: true };
  }
}
