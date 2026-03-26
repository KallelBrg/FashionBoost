import { IsEnum, IsNotEmpty } from 'class-validator';
import { SaleStatus } from '../../entities/sale.entity';

export class UpdateSaleStatusDto {
  @IsNotEmpty()
  @IsEnum(SaleStatus)
  status: SaleStatus;
}
