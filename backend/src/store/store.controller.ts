import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { StoreService } from './store.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@UseGuards(JwtAuthGuard)
@Controller('stores')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Post()
  create(@Request() req, @Body() dto: CreateStoreDto) {
    return this.storeService.create(req.user.tenantId, dto);
  }

  @Get('me')
  getMyStore(@Request() req) {
    return this.storeService.findByTenant(req.user.tenantId);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateStoreDto) {
    return this.storeService.update(id, req.user.tenantId, dto);
  }
}
