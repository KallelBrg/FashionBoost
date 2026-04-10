import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StoreService } from '../store/store.service';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly storeService: StoreService,
  ) {}

  @Get('insights')
  async getInsights(@Request() req) {
    const store = await this.storeService.findByTenant(req.user.tenantId);
    return this.dashboardService.getInsights(store.id);
  }
}
