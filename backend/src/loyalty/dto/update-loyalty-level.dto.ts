import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateLoyaltyLevelDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  minimumPoints?: number;

  @IsOptional()
  @IsString()
  benefitsDescription?: string;
}
