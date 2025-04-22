import { PickType } from '@nestjs/swagger';
import { identifiersDto } from './identifiers.dto';

export class CreateIdentifierDto extends PickType(identifiersDto, [
  'name',
  'domainId',
  'expireAt',
  'userId',
] as const) {}
