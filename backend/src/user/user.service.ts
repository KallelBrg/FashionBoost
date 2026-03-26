import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findMe(id: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    const { passwordHash, ...result } = user;
    return result;
  }

  async findAllByTenant(tenantId: string): Promise<Omit<User, 'passwordHash'>[]> {
    const users = await this.userRepository.find({ where: { tenantId } });
    return users.map(({ passwordHash, ...rest }) => rest);
  }

  async update(id: string, dto: UpdateUserDto): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, 10);
    }
    if (dto.name) user.name = dto.name;
    if (dto.email) user.email = dto.email;

    const saved = await this.userRepository.save(user);
    const { passwordHash, ...result } = saved;
    return result;
  }

  async createEmployee(tenantId: string, dto: CreateEmployeeDto): Promise<Omit<User, 'passwordHash'>> {
    const exists = await this.userRepository.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email já cadastrado');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const employee = this.userRepository.create({
      tenantId,
      name: dto.name,
      email: dto.email,
      passwordHash,
      role: 'employee',
    });

    const saved = await this.userRepository.save(employee);
    const { passwordHash: _, ...result } = saved;
    return result;
  }
}
