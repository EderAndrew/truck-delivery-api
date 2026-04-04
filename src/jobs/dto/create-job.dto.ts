import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { JobStatus } from '../../common/enums/job-status.enum.js';
import { GeoPointDto } from '../../common/dto/geo-point.dto.js';

export class CreateJobDto {
  @IsString()
  @IsOptional()
  customer_name?: string;

  @IsString()
  @IsOptional()
  customer_phone?: string;

  @IsString()
  @IsOptional()
  address_street?: string;

  @IsString()
  @IsOptional()
  address_complement?: string;

  @IsString()
  @IsOptional()
  address_number?: string;

  @IsString()
  @IsOptional()
  address_city?: string;

  @IsString()
  @IsOptional()
  address_state?: string;

  @IsString()
  @IsOptional()
  address_zip?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @ValidateNested()
  @Type(() => GeoPointDto)
  @IsOptional()
  origin_point?: GeoPointDto;

  @ValidateNested()
  @Type(() => GeoPointDto)
  @IsOptional()
  delivery_point?: GeoPointDto;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  volume_m3?: number;

  @IsDateString()
  @IsOptional()
  scheduled_at?: string;

  @IsEnum(JobStatus)
  @IsOptional()
  status?: JobStatus;
}
