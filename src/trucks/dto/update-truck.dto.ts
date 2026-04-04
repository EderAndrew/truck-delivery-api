import { PartialType } from '@nestjs/mapped-types';
import { CreateTruckDto } from './create-truck.dto.js';

export class UpdateTruckDto extends PartialType(CreateTruckDto) {}
