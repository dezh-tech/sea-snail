import type { Metadata } from '@grpc/grpc-js';
import { Controller } from '@nestjs/common';

import {
  DeleteDomainRequest,
  DeleteDomainResponse,
  DomainServiceController,
  DomainServiceControllerMethods,
  DomainStatus,
  RegisterDomainRequest,
  RegisterDomainResponse,
  UpdateDomainRequest,
  UpdateDomainResponse,
} from '../../../modules/grpc/gen/ts/domain';
import { DomainsService } from '../domains.service';

@Controller()
@DomainServiceControllerMethods()
export class DomainServiceGrpcController implements DomainServiceController {
  constructor(private readonly service: DomainsService) {}

  async registerDomain(request: RegisterDomainRequest, _metadata?: Metadata): Promise<RegisterDomainResponse> {
    const d = await this.service.create({
      domain: request.domain,
      basePrice: (request.basePrice as unknown as Long).toNumber(),
      defaultTTL: (request.defaultTtl as unknown as Long).toNumber(),
    });

    return {
      id: d._id.toString(),
      basePrice: d.basePrice,
      defaultTtl: d.defaultTTL,
      domain: d.domain,
      status: DomainStatus[d.status as unknown as keyof typeof DomainStatus],
    };
  }

  async updateDomain(request: UpdateDomainRequest, _metadata?: Metadata): Promise<UpdateDomainResponse> {
    const d = await this.service.update(request.id, {
      basePrice: request.basePrice,
      defaultTTL: request.defaultTtl,
      domain: request.domain,
    });

    return {
      basePrice: d.basePrice,
      defaultTtl: d.defaultTTL,
      domain: d.domain,
      id: d._id.toString(),
      status: DomainStatus[d.status as unknown as keyof typeof DomainStatus],
    };
  }

  async deleteDomain(_request: DeleteDomainRequest, _metadata?: Metadata): Promise<DeleteDomainResponse> {
    return {};
  }
}
