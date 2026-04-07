import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { TruckStatus } from '../../common/enums/truck-status.enum.js';

export class FindAllTrucksQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(TruckStatus)
  status?: TruckStatus;
}
