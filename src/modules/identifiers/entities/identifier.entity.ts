import { AbstractEntity } from '../../../common/abstract.entity';
import { UserDto } from '../../../modules/users/dto/user.dto';
import { Column, Entity } from 'typeorm';
import { IdentifierStatusEnum } from '../enums/identifier-status.enum';
import { identifiersDto } from '../dto/identifiers.dto';

@Entity('identifiers')
export class identifiersEntity extends AbstractEntity<identifiersDto> {
  dtoClass = identifiersDto;

  @Column()
  name: string;

  @Column()
  domainId: string;

  @Column({ unique: true })
  fullIdentifier: string;

  @Column()
  userId: string;

  @Column()
  status: IdentifierStatusEnum;

  @Column()
  expireAt?: Date;

  constructor(item?: Partial<identifiersEntity>) {
    super();

    if (!item) {
      return;
    }

    this.assign(item);
  }

  assign(item: Partial<identifiersEntity>): void {
    super.assign(item);

    this.name = item.name?.toLocaleLowerCase() ?? this.name;
    this.domainId = item.domainId ?? this.domainId;
    this.fullIdentifier = item.fullIdentifier?.toLocaleLowerCase() ?? this.fullIdentifier;
    this.userId = item.userId ?? this.userId;
    this.expireAt = item.expireAt ?? this.expireAt;
    this.status = item.status ?? this.status;
  }
}
