import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../entities/customer.entity';
import { CustomerLoyalty } from '../entities/customer-loyalty.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(CustomerLoyalty)
    private customerLoyaltyRepository: Repository<CustomerLoyalty>,
  ) {}

  async create(storeId: string, dto: CreateCustomerDto): Promise<Customer> {
    const cpfExists = await this.customerRepository.findOne({
      where: { storeId, cpf: dto.cpf },
    });
    if (cpfExists) throw new ConflictException('CPF já cadastrado nesta loja');

    if (dto.email) {
      const emailExists = await this.customerRepository.findOne({
        where: { storeId, email: dto.email },
      });
      if (emailExists) throw new ConflictException('Email já cadastrado nesta loja');
    }

    const customer = this.customerRepository.create({ ...dto, storeId });
    return this.customerRepository.save(customer);
  }

  async findAll(storeId: string): Promise<Customer[]> {
    const customers = await this.customerRepository.find({
      where: { storeId },
      order: { name: 'ASC' },
    });

    const loyalties = await this.customerLoyaltyRepository.find({
      where: { storeId },
      relations: ['loyaltyLevel'],
    });

    const loyaltyMap = new Map(loyalties.map((l) => [l.customerId, l]));

    return customers.map((c) => {
      (c as any).loyalty = loyaltyMap.get(c.id) ?? null;
      return c;
    });
  }

  async findOne(id: string, storeId: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({ where: { id, storeId } });
    if (!customer) throw new NotFoundException('Cliente não encontrado');
    return customer;
  }

  async update(id: string, storeId: string, dto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.customerRepository.findOne({ where: { id, storeId } });
    if (!customer) throw new NotFoundException('Cliente não encontrado');

    if (dto.email && dto.email !== customer.email) {
      const emailExists = await this.customerRepository.findOne({
        where: { storeId, email: dto.email },
      });
      if (emailExists) throw new ConflictException('Email já cadastrado nesta loja');
    }

    Object.assign(customer, dto);
    return this.customerRepository.save(customer);
  }
}
