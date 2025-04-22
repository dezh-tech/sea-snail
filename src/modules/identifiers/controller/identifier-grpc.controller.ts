import type { Metadata } from '@grpc/grpc-js';
import { Controller } from '@nestjs/common';

import {
  DeleteIdentifierRequest,
  DeleteIdentifierResponse,
  IdentifierServiceController,
  IdentifierServiceControllerMethods,
  IdentifierStatus,
  RegisterIdentifierRequest,
  RegisterIdentifierResponse,
  UpdateIdentifierRequest,
  UpdateIdentifierResponse,
} from '../../../../src/modules/grpc/gen/ts/identifier';
import { IdentifiersService } from '../identifiers.service';

@Controller()
@IdentifierServiceControllerMethods()
export class IdentifierServiceGrpcController implements IdentifierServiceController {
  constructor(private readonly service: IdentifiersService) {}

  async registerIdentifier(request: RegisterIdentifierRequest, _metadata?: Metadata): Promise<RegisterIdentifierResponse> {
    const d = await this.service.register({
      name: request.name,
      domainId: request.domainId,
      userId: request.user,
      expireAt: new Date((request.expireAt as unknown as Long).toNumber()),
    });

    return {
      id: d._id.toString(),
      domainId: d.domainId,
      expireAt: d.expireAt?.getDate() ?? 0,
      fullIdentifier: d.fullIdentifier,
      name: d.name,
      user: d.userId,
      status: IdentifierStatus[d.status as unknown as keyof typeof IdentifierStatus],
    };
  }

  async updateIdentifier(request: UpdateIdentifierRequest, _metadata?: Metadata): Promise<UpdateIdentifierResponse> {
    const d = await this.service.update(request.id, {
      domainId: request.domainId,
      expireAt: new Date((request.expireAt as unknown as Long).toNumber()),
      name: request.name,
      userId: request.user,
    });

    return {
      id: d._id.toString(),
      domainId: d.domainId,
      expireAt: d.expireAt?.getDate() ?? 0,
      fullIdentifier: d.fullIdentifier,
      name: d.name,
      user: d.userId,
      status: IdentifierStatus[d.status as unknown as keyof typeof IdentifierStatus],
    };
  }

  async deleteIdentifier(_request: DeleteIdentifierRequest, _metadata?: Metadata): Promise<DeleteIdentifierResponse> {
    return {};
  }
}
