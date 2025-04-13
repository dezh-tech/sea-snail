import { PartialType } from '@nestjs/swagger';
import { CreateIdentifierDto } from './create-identifier.dto';

export class UpdateIdentifierDto extends PartialType(CreateIdentifierDto) {}
