import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { SaleService } from './sale.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleStatusDto } from './dto/update-sale-status.dto';
import { StoreService } from '../store/store.service';

@UseGuards(JwtAuthGuard)
@Controller('sales')
export class SaleController {
  constructor(
    private readonly saleService: SaleService,
    private readonly storeService: StoreService,
  ) {}

  @Post()
  async create(@Request() req, @Body() dto: CreateSaleDto) {
    const store = await this.storeService.findByTenant(req.user.tenantId);
    return this.saleService.create(store.id, req.user.id, dto);
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
    return this.saleService.updateStatus(id, store.id, dto);
  }
}
