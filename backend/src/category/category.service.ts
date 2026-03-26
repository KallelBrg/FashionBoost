import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async create(storeId: string, dto: CreateCategoryDto): Promise<Category> {
    const exists = await this.categoryRepository.findOne({
      where: { storeId, name: dto.name },
    });
    if (exists) throw new ConflictException('Categoria já existe nesta loja');

    const category = this.categoryRepository.create({ ...dto, storeId });
    return this.categoryRepository.save(category);
  }

  async findAll(storeId: string): Promise<Category[]> {
    return this.categoryRepository.find({ where: { storeId }, order: { name: 'ASC' } });
  }

  async update(id: string, storeId: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id, storeId } });
    if (!category) throw new NotFoundException('Categoria não encontrada');

    const exists = await this.categoryRepository.findOne({ where: { storeId, name: dto.name } });
    if (exists && exists.id !== id) throw new ConflictException('Já existe uma categoria com esse nome');

    Object.assign(category, dto);
    return this.categoryRepository.save(category);
  }

  async remove(id: string, storeId: string): Promise<void> {
    const category = await this.categoryRepository.findOne({ where: { id, storeId } });
    if (!category) throw new NotFoundException('Categoria não encontrada');
    await this.categoryRepository.remove(category);
  }
}
