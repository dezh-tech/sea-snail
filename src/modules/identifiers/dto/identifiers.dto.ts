import { AbstractDto } from 'src/common/dto/abstract.dto';
import { DateField, StringField } from 'src/decorators';
import { identifiersEntity } from '../entities/identifier.entity';

export class identifiersDto extends AbstractDto {
  @StringField()
  name: string;

  @StringField()
  domainId: string;

  @StringField()
  fullIdentifier: string;

  @StringField()
  userId: string;

  @DateField()
  expireAt?: Date;

  constructor(e: identifiersEntity) {
    super(e);

    this.name = e.name;
    this.domainId = e.domainId;
    this.fullIdentifier = e.fullIdentifier;
    this.userId = e.userId;
    this.expireAt = e.expireAt;
  }
}
