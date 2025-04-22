import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { CreateRecordDto } from './create-record.dto';
import { StringField } from '../../../../src/decorators';

export class UpdateRecordDto extends PartialType(OmitType(CreateRecordDto, ['identifierId'])) {
  @StringField()
  id: string;
}
export class UpdateRecordBulkDto {
  @ApiProperty({ isArray: true, type: UpdateRecordDto })
  records: UpdateRecordDto[];
}
