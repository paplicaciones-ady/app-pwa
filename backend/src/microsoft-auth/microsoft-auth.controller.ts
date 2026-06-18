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
    @Headers('referer') referer?: string,
  ) {
    console.log('[Microsoft Login] === INICIO FLUJO LOGIN ===');
    console.log('[Microsoft Login] Referer header recibido:', referer);
    const origin = referer ? new URL(referer).origin : undefined;
    console.log('[Microsoft Login] Origin resuelto:', origin);
    console.log('[Microsoft Login] redirectTo param:', redirectTo);
    const result = await this.microsoftAuthService.generateLoginUrl(redirectTo, origin);
    console.log('[Microsoft Login] URL generada:', result.url);
    return result;
  }

  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
    @Query('error') error?: string,
  ) {
    console.log('[Microsoft Callback] === INICIO CALLBACK ===');
    console.log('[Microsoft Callback] code presente:', !!code);
    console.log('[Microsoft Callback] state:', state);
    console.log('[Microsoft Callback] error param:', error);
    console.log('[Microsoft Callback] Headers:', JSON.stringify({
      host: (res.req as any)?.headers?.host,
      referer: (res.req as any)?.headers?.referer,
      origin: (res.req as any)?.headers?.origin,
      'x-forwarded-proto': (res.req as any)?.headers?.['x-forwarded-proto'],
      'x-forwarded-host': (res.req as any)?.headers?.['x-forwarded-host'],
    }));

    const resolveErrorUrl = (state?: string, errorMsg?: string) => {
      const redirectTo = state
        ? (this.microsoftAuthService.peekStateRedirectTo(state) ?? 'http://localhost:4200')
        : 'http://localhost:4200';
      const url = `${redirectTo}/auth/callback?error=${errorMsg ?? 'invalid_request'}`;
      console.log('[Microsoft Callback] URL de error resuelta:', url);
      return url;
    };

    if (error || !code || !state) {
      const errorUrl = resolveErrorUrl(state, error ?? 'invalid_request');
      console.log('[Microsoft Callback] Error o parámetros faltantes, redirigiendo a:', errorUrl);
      return res.redirect(errorUrl);
    }

    try {
      const { redirectUrl } =
        await this.microsoftAuthService.handleCallback(code, state);
      console.log('[Microsoft Callback] Redirect URL final:', redirectUrl);
      return res.redirect(redirectUrl);
    } catch (err) {
      console.error('[Microsoft Callback] Error en handleCallback:', err);
      const errorUrl = resolveErrorUrl(state, 'callback_failed');
      console.log('[Microsoft Callback] Redirigiendo a URL de error:', errorUrl);
      return res.redirect(errorUrl);
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
