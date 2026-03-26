import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateLoyaltyLevelDto } from './dto/create-loyalty-level.dto';
import { UpdateLoyaltyLevelDto } from './dto/update-loyalty-level.dto';
import { AdjustPointsDto } from './dto/adjust-points.dto';
import { StoreService } from '../store/store.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class LoyaltyController {
  constructor(
    private readonly loyaltyService: LoyaltyService,
    private readonly storeService: StoreService,
  ) {}

  @Post('loyalty-levels')
  async createLevel(@Request() req, @Body() dto: CreateLoyaltyLevelDto) {
    const store = await this.storeService.findByTenant(req.user.tenantId);
    return this.loyaltyService.createLevel(store.id, dto);
  }

  @Get('loyalty-levels')
  async findAllLevels(@Request() req) {
    const store = await this.storeService.findByTenant(req.user.tenantId);
    return this.loyaltyService.findAllLevels(store.id);
  }

  @Patch('loyalty-levels/:id')
  async updateLevel(@Request() req, @Param('id') id: string, @Body() dto: UpdateLoyaltyLevelDto) {
    const store = await this.storeService.findByTenant(req.user.tenantId);
    return this.loyaltyService.updateLevel(id, store.id, dto);
  }

  @Delete('loyalty-levels/:id')
  async removeLevel(@Request() req, @Param('id') id: string) {
    const store = await this.storeService.findByTenant(req.user.tenantId);
    return this.loyaltyService.removeLevel(id, store.id);
  }

  @Get('customer-loyalty/:customerId')
  async getCustomerLoyalty(@Request() req, @Param('customerId') customerId: string) {
    const store = await this.storeService.findByTenant(req.user.tenantId);
    return this.loyaltyService.getCustomerLoyalty(customerId, store.id);
  }

  @Post('customer-loyalty/:customerId/adjust')
  async adjustPoints(@Request() req, @Param('customerId') customerId: string, @Body() dto: AdjustPointsDto) {
    const store = await this.storeService.findByTenant(req.user.tenantId);
    return this.loyaltyService.adjustPoints(customerId, store.id, dto);
  }
}
