import { Column, Entity } from 'typeorm';

import { AbstractEntity } from '../../../../src/common/abstract.entity';
import { RecordType } from '../enums/record-types.enum';
import { RecordDto } from '../dto/record.dto';

@Entity('records')
export class RecordEntity extends AbstractEntity<RecordDto> {
  dtoClass = RecordDto;

  @Column()
  identifierId: string;

  @Column()
  type: keyof typeof RecordType | RecordType;

  @Column()
  value: string;

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
  }
}
