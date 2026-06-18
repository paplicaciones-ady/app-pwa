import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PasskeyCredential } from './passkey.entity';
import { PasskeysService } from './passkeys.service';
import { PasskeysController } from './passkeys.controller';
import { UsersModule } from '../users/users.module';
import { DevicesModule } from '../devices/devices.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PasskeyCredential]),
    UsersModule,
    DevicesModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [PasskeysController],
  providers: [PasskeysService],
  exports: [PasskeysService],
})
export class PasskeysModule {}
