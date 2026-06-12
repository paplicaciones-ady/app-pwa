import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pqrs } from './pqrs.entity';
import { ProductsService } from '../products/products.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class PqrsService {
  constructor(
    @InjectRepository(Pqrs)
    private readonly repo: Repository<Pqrs>,
    private readonly productsService: ProductsService,
    private readonly usersService: UsersService,
  ) {}

  async findAll() {
    const pqrsList = await this.repo.find({ order: { createdAt: 'DESC' } });

    return Promise.all(
      pqrsList.map(async (pqrs) => {
        const product = await this.productsService.findById(pqrs.productId);
        const user = await this.usersService.findById(pqrs.userId);
        return {
          ...pqrs,
          productName: product?.name ?? null,
          productId: product?.id ?? pqrs.productId,
          userEmail: user?.email ?? null,
        };
      }),
    );
  }

  async findById(id: number) {
    const pqrs = await this.repo.findOne({ where: { id } });
    if (!pqrs) {
      throw new NotFoundException('PQRS not found');
    }
    return pqrs;
  }

  async create(data: { type: string; title: string; description: string; productId: number; userId: number }) {
    const pqrs = this.repo.create(data);
    return this.repo.save(pqrs);
  }

  async delete(id: number, userId: number) {
    const pqrs = await this.repo.findOne({ where: { id } });
    if (!pqrs) {
      throw new NotFoundException('PQRS not found');
    }
    if (pqrs.userId !== userId) {
      throw new UnauthorizedException('PQRS does not belong to user');
    }
    await this.repo.remove(pqrs);
  }
}
