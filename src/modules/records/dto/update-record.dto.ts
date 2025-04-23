import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { CreateRecordDto } from './create-record.dto';
import { StringField } from '../../../../src/decorators';
import { IsArray, IsObject } from 'class-validator';

export class UpdateRecordDto extends PartialType(OmitType(CreateRecordDto, ['identifierId'])) {
  @StringField()
  id: string;
}

export class UpdateRecordBulkDto {
  @ApiProperty({ type: () => [UpdateRecordDto], required: true })
  @IsObject({each:true})
  records: UpdateRecordDto[];
}
