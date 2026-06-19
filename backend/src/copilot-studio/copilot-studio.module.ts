import { Module } from '@nestjs/common';
import { CopilotStudioController } from './copilot-studio.controller';
import { MicrosoftAuthModule } from '../microsoft-auth/microsoft-auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [MicrosoftAuthModule, UsersModule],
  controllers: [CopilotStudioController],
})
export class CopilotStudioModule {}
