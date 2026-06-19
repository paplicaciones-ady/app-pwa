import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PasskeysModule } from './passkeys/passkeys.module';
import { ProductsModule } from './products/products.module';
import { PqrsModule } from './pqrs/pqrs.module';
import { DevicesModule } from './devices/devices.module';
import { MicrosoftAuthModule } from './microsoft-auth/microsoft-auth.module';
import { CopilotStudioModule } from './copilot-studio/copilot-studio.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        return {
          type: 'postgres',
          host: process.env.DB_HOST ?? 'localhost',
          port: +(process.env.DB_PORT ?? 5432),
          username: process.env.DB_USER ?? 'app',
          password: process.env.DB_PASSWORD ?? 'app-secret',
          database: process.env.DB_NAME ?? 'webauthn',
          autoLoadEntities: true,
          synchronize: true,
        };
      },
    }),
    UsersModule,
    AuthModule,
    PasskeysModule,
    ProductsModule,
    PqrsModule,
    DevicesModule,
    MicrosoftAuthModule,
    CopilotStudioModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
