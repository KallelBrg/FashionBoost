import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateLoyaltyLevelDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  minimumPoints: number;

  @IsOptional()
  @IsString()
  benefitsDescription?: string;
}
