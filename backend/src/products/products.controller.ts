import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.productsService.findById(+id);
  }

  @Post()
  async create(@Body('name') name: string, @Body('description') description?: string) {
    return this.productsService.create(name, description);
  }
}
