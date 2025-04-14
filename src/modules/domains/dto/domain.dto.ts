import { AbstractDto } from '../../../../src/common/dto/abstract.dto';
import { DomainEntity } from '../entities/domain.entity';
import { NumberField, StringField } from '../../../decorators';
import { DomainStatusEnum } from '../enums/domain-status.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class DomainDto extends AbstractDto {
  @StringField()
  domain: string;

  @NumberField()
  basePrice: number;

  @NumberField()
  defaultTTL: number;

  @ApiProperty()
  @IsEnum(DomainStatusEnum)
  status: DomainStatusEnum;

  constructor(e: DomainEntity) {
    super(e);

    this.domain = e.domain;
    this.basePrice = e.basePrice;
    this.defaultTTL = e.defaultTTL;
    this.status = e.status;
  }
}
