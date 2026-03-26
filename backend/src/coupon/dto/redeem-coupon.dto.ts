import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export enum CouponType {
  FIXED_DISCOUNT = 'fixed_discount',
  PERCENTAGE_DISCOUNT = 'percentage_discount',
  GIFT = 'gift',
}

export class RedeemCouponDto {
  @IsNotEmpty()
  @IsUUID()
  customerId: string;

  @IsNotEmpty()
  @IsEnum(CouponType)
  type: CouponType;

  @IsNotEmpty()
  @IsString()
  rewardDescription: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  pointsUsed: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountValue?: number;
}
