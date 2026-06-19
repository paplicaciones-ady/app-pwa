import { Controller, Post, Body, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { MicrosoftAuthService } from '../microsoft-auth/microsoft-auth.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('copilot')
export class CopilotStudioController {
  constructor(
    private readonly microsoftAuthService: MicrosoftAuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('debug-token')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async debugToken(@Req() req: any) {
    const user = await this.usersService.findById(req.user.id);
    const diagnostic = {
      jwtUserId: req.user.id,
      dbUserId: user?.id,
      email: user?.email ?? null,
      microsoftId: user?.microsoftId ?? null,
      hasRefreshToken: !!user?.microsoftRefreshToken,
    };

    if (!user?.microsoftRefreshToken) {
      return {
        ...diagnostic,
        hasMicrosoftSession: false,
        ppTokenOk: false,
        message: 'No hay refresh token de Microsoft almacenado. Inicia sesión con Microsoft.',
      };
    }

    const result = await this.microsoftAuthService.getPowerPlatformToken(req.user.id);

    if (!result) {
      return {
        ...diagnostic,
        hasMicrosoftSession: true,
        ppTokenOk: false,
        message: 'El refresh token existe pero Azure lo rechazó (expirado o revocado). Vuelve a iniciar sesión con Microsoft.',
      };
    }

    return {
      ...diagnostic,
      hasMicrosoftSession: true,
      ppTokenOk: true,
      ppTokenPreview: result.preview,
      tokenOid: result.tokenOid,
      tokenUpn: result.tokenUpn,
      message: 'Token PowerPlatform obtenido correctamente',
    };
  }

  @Post('debug-invalidate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async debugInvalidate(@Req() req: any) {
    try {
      await this.usersService.clearMicrosoftRefreshToken(req.user.id);
      this.microsoftAuthService.clearPowerPlatformCache(req.user.id);
      return { ok: true, message: 'Refresh token de Microsoft eliminado de la BD' };
    } catch (err: any) {
      console.error('[CopilotStudio] debug-invalidate error:', err?.message ?? err);
      throw err;
    }
  }

  @Post('chat')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async chat(@Req() req: any, @Body() body: { message: string }) {
    return { reply: `Copilot Studio recibió: "${body.message}". (integración pendiente)` };
  }
}
