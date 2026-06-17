import {
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { Response } from 'express';
import { MicrosoftAuthService } from './microsoft-auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('auth/microsoft')
export class MicrosoftAuthController {
  constructor(
    private readonly microsoftAuthService: MicrosoftAuthService,
  ) {}

  @Get('login')
  async login(
    @Query('redirectTo') redirectTo?: string,
    @Headers('origin') origin?: string,
  ) {
    return this.microsoftAuthService.generateLoginUrl(redirectTo, origin);
  }

  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
    @Query('error') error?: string,
  ) {
    if (error || !code || !state) {
      const frontendUrl =
        process.env['FRONTEND_URL'] ?? 'http://localhost:4200';
      return res.redirect(
        `${frontendUrl}/auth/callback?error=${error ?? 'invalid_request'}`,
      );
    }

    try {
      const { redirectUrl } =
        await this.microsoftAuthService.handleCallback(code, state);
      return res.redirect(redirectUrl);
    } catch {
      const frontendUrl =
        process.env['FRONTEND_URL'] ?? 'http://localhost:4200';
      return res.redirect(
        `${frontendUrl}/auth/callback?error=callback_failed`,
      );
    }
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: any) {
    const ok = await this.microsoftAuthService.refreshTokens(req.user.id);
    if (!ok) {
      return { ok: false, reason: 'No refresh token available or expired' };
    }
    return { ok: true };
  }
}
