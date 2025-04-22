import { PickType } from '@nestjs/swagger';
import { identifiersDto } from './identifiers.dto';

export class IsExistIdentifierDto extends PickType(identifiersDto, ['domainId', 'name'] as const) {}
