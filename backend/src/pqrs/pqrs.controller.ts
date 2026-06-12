import { Controller, Get, Post, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { PqrsService } from './pqrs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('pqrs')
export class PqrsController {
  constructor(private readonly pqrsService: PqrsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll() {
    return this.pqrsService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Req() req: any,
    @Body('type') type: string,
    @Body('title') title: string,
    @Body('description') description: string,
    @Body('productId') productId: number,
  ) {
    return this.pqrsService.create({
      type,
      title,
      description,
      productId,
      userId: req.user.id,
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Req() req: any, @Param('id') id: string) {
    await this.pqrsService.delete(+id, req.user.id);
    return { ok: true };
  }
}
