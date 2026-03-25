import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Tenant } from '../entities/tenant.entity';
import { User } from '../entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const emailExists = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (emailExists) {
      throw new ConflictException('E-mail já cadastrado.');
    }

    const slugExists = await this.tenantRepository.findOne({
      where: { slug: dto.tenantSlug },
    });
    if (slugExists) {
      throw new ConflictException('Slug já utilizado.');
    }

    const tenant = this.tenantRepository.create({
      name: dto.tenantName,
      slug: dto.tenantSlug,
      status: 'active',
    });
    await this.tenantRepository.save(tenant);

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      tenantId: tenant.id,
      name: dto.userName,
      email: dto.email,
      passwordHash,
      role: 'owner',
    });
    await this.userRepository.save(user);

    const token = this.generateToken(user);
    return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role, tenantId: user.tenantId } };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const token = this.generateToken(user);
    return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role, tenantId: user.tenantId } };
  }

  private generateToken(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };
    return this.jwtService.sign(payload);
  }
}
