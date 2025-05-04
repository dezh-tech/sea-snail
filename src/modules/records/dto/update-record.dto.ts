import { PartialType, PickType } from '@nestjs/swagger';
import { RecordDto } from './record.dto';
import { StringFieldOptional } from '../../../../src/decorators';
import { IsArray, IsEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

export class UpdateRecordDto extends PartialType(PickType(RecordDto, ['type', 'value', 'key'] as const)) {}

export class UpdateRecordBulkDto {
  @StringFieldOptional()
  @ValidateIf((o) => o.npub !== '') // skip validation if empty string
  npub?: string | null;

  @IsOptional()
  @IsArray()
  @ValidateIf((o) => o.relays !== '' && o.relays !== undefined)
  relays?: string[] | null;

  @StringFieldOptional()
  @ValidateIf((o) => o.lightning !== '') // skip validation if empty string
  lightning?: string | null;
}
