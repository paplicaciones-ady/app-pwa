import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CopilotStudioController } from './copilot-studio.controller';
import { CopilotStudioService } from './copilot-studio.service';
import { MicrosoftAuthModule } from '../microsoft-auth/microsoft-auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [ConfigModule, MicrosoftAuthModule, UsersModule],
  controllers: [CopilotStudioController],
  providers: [CopilotStudioService],
  exports: [CopilotStudioService],
})
export class CopilotStudioModule {}
