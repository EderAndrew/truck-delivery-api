import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { TripStatus } from '../../common/enums/trip-status.enum.js';

export class FindAllTripsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(TripStatus)
  status?: TripStatus;

  @IsOptional()
  @IsUUID()
  driver_id?: string;

  @IsOptional()
  @IsUUID()
  truck_id?: string;
}
