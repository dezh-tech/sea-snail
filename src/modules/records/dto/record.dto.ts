import { EnumField, NumberField, StringField } from 'src/decorators';
import { AbstractDto } from '../../../../src/common/dto/abstract.dto';
import { RecordEntity } from '../entities/record.entity';
import { RecordType } from '../enums/record-types.enum';

export class RecordDto extends AbstractDto {
  @StringField()
  identifierId: string;

  @EnumField(() => RecordType)
  type: keyof typeof RecordType | RecordType;

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
