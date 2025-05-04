import { Column, Entity } from 'typeorm';

import { AbstractEntity } from '../../../../src/common/abstract.entity';
import { RecordDto } from '../dto/record.dto';
import { RecordTypeEnum } from '../enums/record-type.enum';

@Entity('records')
export class RecordEntity extends AbstractEntity<RecordDto> {
  dtoClass = RecordDto;

  @Column()
  identifierId: string;

  @Column()
  type: keyof typeof RecordTypeEnum | RecordTypeEnum;

  @Column()
  key: string;

  @Column()
  value: string | string[] | null;

  @Column()
  priority: number;

  @Column()
  ttl: number;

  constructor(item?: Partial<RecordEntity>) {
    super();

    if (!item) {
      return;
    }

    this.assign(item);
  }

  assign(item: Partial<RecordEntity>): void {
    super.assign(item);

    this.identifierId = item.identifierId ?? this.identifierId;
    this.type = item.type ?? this.type;
    this.value = item.value ?? this.value;
    this.priority = item.priority ?? this.priority;
    this.ttl = item.ttl ?? this.ttl;
    this.key = item.key ?? this.key;
  }
}
