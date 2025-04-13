import { Column, Entity } from 'typeorm';

import { AbstractEntity } from '../../../../src/common/abstract.entity';
import { UserDto } from '../dto/user.dto';

@Entity('users')
export class UserEntity extends AbstractEntity<UserDto> {
  dtoClass = UserDto;

  @Column()
  pubkey: string;

  constructor(item?: Partial<UserEntity>) {
    super();

    if (!item) {
      return;
    }

    this.assign(item);
  }

  assign(item: Partial<UserEntity>): void {
    super.assign(item);

    this.pubkey = item.pubkey ?? this.pubkey;
  }
}
