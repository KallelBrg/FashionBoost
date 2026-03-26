import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { CategoryService } from './category.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { StoreService } from '../store/store.service';

@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoryController {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly storeService: StoreService,
  ) {}

  @Post()
  async create(@Request() req, @Body() dto: CreateCategoryDto) {
    const store = await this.storeService.findByTenant(req.user.tenantId);
    return this.categoryService.create(store.id, dto);
  }

  @Get()
  async findAll(@Request() req) {
    const store = await this.storeService.findByTenant(req.user.tenantId);
    return this.categoryService.findAll(store.id);
  }

  @Patch(':id')
  async update(@Request() req, @Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    const store = await this.storeService.findByTenant(req.user.tenantId);
    return this.categoryService.update(id, store.id, dto);
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    const store = await this.storeService.findByTenant(req.user.tenantId);
    return this.categoryService.remove(id, store.id);
  }
}
