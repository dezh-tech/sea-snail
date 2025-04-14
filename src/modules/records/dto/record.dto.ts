import { EnumField, NumberField, StringField } from '../../../decorators';
import { AbstractDto } from '../../../../src/common/dto/abstract.dto';
import { RecordEntity } from '../entities/record.entity';
import { RecordTypeEnum } from '../enums/record-type.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class RecordDto extends AbstractDto {
  @StringField()
  identifierId: string;

  @ApiProperty()
  @IsEnum(RecordTypeEnum)
  type: keyof typeof RecordTypeEnum | RecordTypeEnum;

  @StringField()
  value: string;

  @NumberField()
  priority: number;

  @NumberField()
  ttl: number;

  constructor(e: RecordEntity) {
    super(e);

    this.identifierId = e.identifierId;
    this.type = e.type;
    this.value = e.value;
    this.priority = e.priority;
    e.ttl = e.ttl;
  }
}
