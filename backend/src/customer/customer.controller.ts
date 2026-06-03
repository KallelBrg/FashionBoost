import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { StoreService } from '../store/store.service';
import { AuditLogService } from '../audit-log/audit-log.service';

@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomerController {
  constructor(
    private readonly customerService: CustomerService,
    private readonly storeService: StoreService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Post()
  async create(@Request() req, @Body() dto: CreateCustomerDto) {
    const store = await this.storeService.findByTenant(req.user.tenantId);
    const customer = await this.customerService.create(store.id, dto);
    await this.auditLogService.log({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      action: 'CLIENTE_CADASTRADO',
      entityName: 'customers',
      entityId: customer.id,
      details: `Cliente "${customer.name}" cadastrado — CPF: ${customer.cpf}`,
    });
    return customer;
  }

  @Get()
  async findAll(@Request() req) {
    const store = await this.storeService.findByTenant(req.user.tenantId);
    return this.customerService.findAll(store.id);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    const store = await this.storeService.findByTenant(req.user.tenantId);
    return this.customerService.findOne(id, store.id);
  }

  @Patch(':id')
  async update(@Request() req, @Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    const store = await this.storeService.findByTenant(req.user.tenantId);
    const customer = await this.customerService.update(id, store.id, dto);
    await this.auditLogService.log({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      action: 'CLIENTE_ATUALIZADO',
      entityName: 'customers',
      entityId: customer.id,
      details: `Dados do cliente "${customer.name}" atualizados`,
    });
    return customer;
  }
}
