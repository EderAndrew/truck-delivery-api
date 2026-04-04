import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TripStatus } from '../../common/enums/trip-status.enum.js';
import { GeoPointDto } from '../../common/dto/geo-point.dto.js';

export class CreateTripDto {
  @IsUUID()
  @IsNotEmpty()
  job_id: string;

  @IsUUID()
  @IsNotEmpty()
  truck_id: string;

  @IsUUID()
  @IsNotEmpty()
  driver_id: string;

  @ValidateNested()
  @Type(() => GeoPointDto)
  @IsOptional()
  current_location?: GeoPointDto;

  @IsDateString()
  @IsOptional()
  estimated_arrival?: string;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  distance_m?: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  duration_s?: number;

  @IsDateString()
  @IsOptional()
  start_time?: string;

  @IsEnum(TripStatus)
  @IsOptional()
  status?: TripStatus;
}
