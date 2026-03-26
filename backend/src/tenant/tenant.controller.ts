import { Body, Controller, Get, Patch, Request, UseGuards } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@UseGuards(JwtAuthGuard)
@Controller('tenant')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get('me')
  getMyTenant(@Request() req) {
    return this.tenantService.findById(req.user.tenantId);
  }

  @Patch('me')
  updateMyTenant(@Request() req, @Body() dto: UpdateTenantDto) {
    return this.tenantService.update(req.user.tenantId, dto);
  }
}
