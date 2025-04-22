import { ApiProperty } from '@nestjs/swagger';
import { IsExistIdentifierDto } from './isExist-identifier.dto';
import { IsString } from 'class-validator';

export class RequestCheckoutSessionForIdentifierDto extends IsExistIdentifierDto {

  @ApiProperty()
  @IsString()
  npub: `npub1${string}`;
}
