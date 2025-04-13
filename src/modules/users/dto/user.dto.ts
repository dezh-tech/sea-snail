import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

import { AbstractDto } from '../../../../src/common/dto/abstract.dto';
import type { UserEntity } from '../entities/user.entity';

export class UserDto extends AbstractDto {
  @ApiProperty()
  @IsString()
  pubkey: string;

  constructor(e: UserEntity) {
    super(e);

    this.pubkey = e.pubkey;
  }
}
