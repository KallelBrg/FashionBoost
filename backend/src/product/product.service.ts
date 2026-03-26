import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async create(storeId: string, dto: CreateProductDto): Promise<Product> {
    const product = this.productRepository.create({ ...dto, storeId });
    return this.productRepository.save(product);
  }

  async findAll(storeId: string): Promise<Product[]> {
    return this.productRepository.find({
      where: { storeId },
      relations: ['category'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string, storeId: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id, storeId },
      relations: ['category'],
    });
    if (!product) throw new NotFoundException('Produto não encontrado');
    return product;
  }

  async update(id: string, storeId: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id, storeId } });
    if (!product) throw new NotFoundException('Produto não encontrado');
    Object.assign(product, dto);
    return this.productRepository.save(product);
  }

  async remove(id: string, storeId: string): Promise<void> {
    const product = await this.productRepository.findOne({ where: { id, storeId } });
    if (!product) throw new NotFoundException('Produto não encontrado');
    product.isActive = false;
    await this.productRepository.save(product);
  }
}
