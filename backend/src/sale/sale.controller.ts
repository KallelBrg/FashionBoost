import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { SaleService } from './sale.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleStatusDto } from './dto/update-sale-status.dto';
import { StoreService } from '../store/store.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { DashboardService } from '../dashboard/dashboard.service';

@UseGuards(JwtAuthGuard)
@Controller('sales')
export class SaleController {
  constructor(
    private readonly saleService: SaleService,
    private readonly storeService: StoreService,
    private readonly auditLogService: AuditLogService,
    private readonly dashboardService: DashboardService,
  ) {}

  @Post()
  async create(@Request() req, @Body() dto: CreateSaleDto) {
    const store = await this.storeService.findByTenant(req.user.tenantId);
    const sale = await this.saleService.create(store.id, req.user.id, dto);
    this.dashboardService.clearCache();
    await this.auditLogService.log({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      action: 'VENDA_CRIADA',
      entityName: 'sales',
      entityId: sale.id,
      details: `Venda criada para o cliente ${sale.customer?.name ?? dto.customerId} — Total: R$ ${Number(sale.totalAmount).toFixed(2)}`,
    });
    return sale;
  }

  @Get()
  async findAll(@Request() req) {
    const store = await this.storeService.findByTenant(req.user.tenantId);
    return this.saleService.findAll(store.id);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    const store = await this.storeService.findByTenant(req.user.tenantId);
    return this.saleService.findOne(id, store.id);
  }

  @Patch(':id/status')
  async updateStatus(@Request() req, @Param('id') id: string, @Body() dto: UpdateSaleStatusDto) {
    const store = await this.storeService.findByTenant(req.user.tenantId);
    const sale = await this.saleService.updateStatus(id, store.id, dto);
    this.dashboardService.clearCache();
    const actionMap: Record<string, string> = {
      cancelled: 'VENDA_CANCELADA',
      exchanged: 'VENDA_TROCADA',
    };
    await this.auditLogService.log({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      action: actionMap[dto.status] ?? 'VENDA_ATUALIZADA',
      entityName: 'sales',
      entityId: sale.id,
      details: `Status da venda alterado para "${dto.status}"`,
    });
    return sale;
  }
}
