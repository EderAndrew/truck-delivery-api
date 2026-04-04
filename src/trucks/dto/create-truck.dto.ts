import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { TruckStatus } from '../../common/enums/truck-status.enum.js';

export class CreateTruckDto {
  @IsString()
  @IsNotEmpty()
  plate: string;

  @IsString()
  @IsOptional()
  truck_type?: string;

  @IsString()
  @IsNotEmpty()
  gh_profile: string;

  @IsInt()
  @IsPositive()
  @IsOptional()
  max_weight_kg?: number;

  @IsEnum(TruckStatus)
  @IsOptional()
  status?: TruckStatus;
}
