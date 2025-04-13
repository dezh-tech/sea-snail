import { PickType } from '@nestjs/swagger';
import { DomainDto } from './domain.dto';

export class CreateDomainDto extends PickType(DomainDto, ['domain', 'basePrice', 'defaultTTL'] as const) {}
