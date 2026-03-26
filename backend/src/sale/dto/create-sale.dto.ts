import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsInt, IsUUID, Min, ValidateNested } from 'class-validator';

export class CreateSaleItemDto {
  @IsNotEmpty()
  @IsUUID()
  productId: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateSaleDto {
  @IsNotEmpty()
  @IsUUID()
  customerId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items: CreateSaleItemDto[];
}
