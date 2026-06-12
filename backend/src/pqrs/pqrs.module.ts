import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pqrs } from './pqrs.entity';
import { PqrsService } from './pqrs.service';
import { PqrsController } from './pqrs.controller';
import { ProductsModule } from '../products/products.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Pqrs]), ProductsModule, UsersModule],
  controllers: [PqrsController],
  providers: [PqrsService],
})
export class PqrsModule {}
