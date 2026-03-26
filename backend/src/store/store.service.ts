import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from '../entities/store.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@Injectable()
export class StoreService {
  constructor(
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
  ) {}

  async create(tenantId: string, dto: CreateStoreDto): Promise<Store> {
    const slugExists = await this.storeRepository.findOne({ where: { slug: dto.slug } });
    if (slugExists) throw new ConflictException('Slug já está em uso');

    const store = this.storeRepository.create({ ...dto, tenantId });
    return this.storeRepository.save(store);
  }

  async findByTenant(tenantId: string): Promise<Store> {
    const store = await this.storeRepository.findOne({ where: { tenantId } });
    if (!store) throw new NotFoundException('Loja não encontrada');
    return store;
  }

  async update(id: string, tenantId: string, dto: UpdateStoreDto): Promise<Store> {
    const store = await this.storeRepository.findOne({ where: { id, tenantId } });
    if (!store) throw new NotFoundException('Loja não encontrada');

    if (dto.slug && dto.slug !== store.slug) {
      const slugExists = await this.storeRepository.findOne({ where: { slug: dto.slug } });
      if (slugExists) throw new ConflictException('Slug já está em uso');
    }

    Object.assign(store, dto);
    return this.storeRepository.save(store);
  }
}
