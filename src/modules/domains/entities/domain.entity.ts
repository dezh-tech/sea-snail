import { Column, Entity, Index } from 'typeorm';

import { AbstractEntity } from '../../../../src/common/abstract.entity';
import { DomainDto } from '../dto/domain.dto';
import { DomainStatusEnum } from '../enums/domain-status.enum';

@Entity('domains')
export class DomainEntity extends AbstractEntity<DomainDto> {
  dtoClass = DomainDto;

  @Column({ unique: true })
  domain: string;

  @Column()
  basePrice: number;

  @Column()
  defaultTTL: number;

  @Column()
  status: DomainStatusEnum;

  constructor(item?: Partial<DomainEntity>) {
    super();

    if (!item) {
      return;
    }

    this.assign(item);
  }

  assign(item: Partial<DomainEntity>): void {
    super.assign(item);

    this.domain = item.domain ?? this.domain;
    this.basePrice = item.basePrice ?? this.basePrice;
    this.defaultTTL = item.defaultTTL ?? this.defaultTTL;
    this.status = item.status ?? this.status;
  }
}
