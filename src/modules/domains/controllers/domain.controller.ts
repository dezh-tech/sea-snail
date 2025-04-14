import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DomainsService } from '../domains.service';
import { DomainStatusEnum } from '../enums/domain-status.enum';

@Controller('domains')
@ApiTags('Domains')
export class DomainsController {
  constructor(private readonly service: DomainsService) {}

  @Get('list')
  async domainList() {
    const domains = await this.service.findAll({
      where: {
        status: DomainStatusEnum.ACTIVE,
      },
    });

    return domains.toDtos()
  }
}
