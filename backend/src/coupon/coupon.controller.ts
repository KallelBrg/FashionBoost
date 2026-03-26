import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RedeemCouponDto } from './dto/redeem-coupon.dto';
import { StoreService } from '../store/store.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class CouponController {
  constructor(
    private readonly couponService: CouponService,
    private readonly storeService: StoreService,
  ) {}

  @Post('coupons/redeem')
  async redeem(@Request() req, @Body() dto: RedeemCouponDto) {
    const store = await this.storeService.findByTenant(req.user.tenantId);
    return this.couponService.redeem(store.id, dto);
  }

  @Get('coupons')
  async findAll(@Request() req) {
    const store = await this.storeService.findByTenant(req.user.tenantId);
    return this.couponService.findAll(store.id);
  }

  @Get('coupons/:code')
  async findByCode(@Request() req, @Param('code') code: string) {
    const store = await this.storeService.findByTenant(req.user.tenantId);
    return this.couponService.findByCode(code, store.id);
  }

  @Post('coupons/:code/use')
  async useCoupon(@Request() req, @Param('code') code: string) {
    const store = await this.storeService.findByTenant(req.user.tenantId);
    return this.couponService.useCoupon(code, store.id);
  }

  @Get('points-transactions/:customerId')
  async getTransactions(@Request() req, @Param('customerId') customerId: string) {
    const store = await this.storeService.findByTenant(req.user.tenantId);
    return this.couponService.findCustomerTransactions(customerId, store.id);
  }
}
