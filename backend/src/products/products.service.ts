import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly repo: Repository<Product>,
  ) {}

  async findAll(): Promise<Product[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: number): Promise<Product | null> {
    return this.repo.findOne({ where: { id } });
  }

  async create(name: string, description?: string): Promise<Product> {
    const product = this.repo.create({ name, description });
    return this.repo.save(product);
  }
}
