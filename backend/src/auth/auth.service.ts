import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import * as nodemailer from 'nodemailer';
import { Tenant } from '../entities/tenant.entity';
import { User } from '../entities/user.entity';
import { Store } from '../entities/store.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private mailer: nodemailer.Transporter;

  constructor(
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.mailer = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'),
      },
    });
  }

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

    const store = this.storeRepository.create({
      tenantId: tenant.id,
      name: dto.tenantName,
      slug: dto.tenantSlug,
    });
    await this.storeRepository.save(store);

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const verificationToken = randomUUID();

    const user = this.userRepository.create({
      tenantId: tenant.id,
      name: dto.userName,
      email: dto.email,
      passwordHash,
      role: 'owner',
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
    });
    await this.userRepository.save(user);

    const appUrl = this.configService.get<string>('APP_URL', 'http://localhost:3000');
    const verifyUrl = `${appUrl}/verify-email?token=${verificationToken}`;

    await this.mailer.sendMail({
      from: `"FashionBoost" <${this.configService.get('MAIL_USER')}>`,
      to: dto.email,
      subject: 'Confirme seu e-mail — FashionBoost',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 40px; border: 1px solid #222;">
          <h1 style="font-size: 24px; margin-bottom: 8px;">Fashion<span style="color: #D4AF37;">Boost</span></h1>
          <p style="color: #aaa; font-size: 14px; margin-bottom: 32px;">Plataforma de Fidelidade para Moda</p>

          <h2 style="font-size: 20px; margin-bottom: 12px;">Confirme seu e-mail</h2>
          <p style="color: #ccc; font-size: 14px; line-height: 1.6; margin-bottom: 32px;">
            Olá, <strong>${dto.userName}</strong>! Sua conta foi criada com sucesso.<br/>
            Clique no botão abaixo para ativar sua conta e acessar o painel.
          </p>

          <a href="${verifyUrl}" style="display: inline-block; background: #D4AF37; color: #000; font-weight: bold; font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase; padding: 14px 28px; text-decoration: none;">
            Verificar E-mail
          </a>

          <p style="color: #555; font-size: 12px; margin-top: 32px;">
            Se você não criou uma conta no FashionBoost, ignore este e-mail.
          </p>
        </div>
      `,
    });

    return { message: 'Conta criada! Verifique seu e-mail para ativar o acesso.' };
  }

  async verifyEmail(token: string) {
    const user = await this.userRepository.findOne({
      where: { emailVerificationToken: token },
    });
    if (!user) {
      throw new NotFoundException('Token inválido ou expirado.');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    await this.userRepository.save(user);

    return { message: 'E-mail verificado com sucesso!' };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('E-mail não verificado. Acesse sua caixa de entrada e clique no link de confirmação.');
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
