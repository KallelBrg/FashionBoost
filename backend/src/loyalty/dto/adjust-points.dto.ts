import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class AdjustPointsDto {
  @IsNotEmpty()
  @IsInt()
  points: number;

  @IsNotEmpty()
  @IsString()
  description: string;
}
