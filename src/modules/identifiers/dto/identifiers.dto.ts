import { AbstractDto } from 'src/common/dto/abstract.dto';
import { DateField, EnumField, StringField } from 'src/decorators';
import { identifiersEntity } from '../entities/identifier.entity';
import { IdentifierStatusEnum } from '../enums/identifier-status.enum';

export class identifiersDto extends AbstractDto {
  @StringField()
  name: string;

  @StringField()
  domainId: string;

  @StringField()
  fullIdentifier: string;

  @StringField()
  userId: string;

  @EnumField(() => IdentifierStatusEnum)
  status: IdentifierStatusEnum;

  @DateField()
  expireAt?: Date;

  constructor(e: identifiersEntity) {
    super(e);

    this.name = e.name;
    this.domainId = e.domainId;
    this.fullIdentifier = e.fullIdentifier;
    this.userId = e.userId;
    this.status = e.status
    this.expireAt = e.expireAt;
  }
}
