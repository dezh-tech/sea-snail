import { AbstractDto } from '../../../../src/common/dto/abstract.dto';
import { DomainEntity } from '../entities/domain.entity';
import { EnumField, NumberField, StringField } from 'src/decorators';
import { DomainStatusEnum } from '../enums/domain-status.enum';

export class DomainDto extends AbstractDto {
  @StringField()
  domain: string;

  @NumberField()
  basePrice: number;

  @NumberField()
  defaultTTL: number;

  @EnumField(() => DomainStatusEnum)
  status: DomainStatusEnum;

  constructor(e: DomainEntity) {
    super(e);

    this.domain = e.domain;
    this.basePrice = e.basePrice;
    this.defaultTTL = e.defaultTTL;
    this.status = e.status;
  }
}
