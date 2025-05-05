import { Injectable, OnModuleInit } from '@nestjs/common';
import { ApiConfigService } from './api-config.service';
import { ManagerGrpcClient } from '../../../src/modules/grpc/manager.client';
import { lastValueFrom } from 'rxjs';
import { ServiceTypeEnum } from '../../../src/modules/grpc/gen/ts/service_registry';

import * as os from 'os';

@Injectable()
export class BootstrapService implements OnModuleInit {
  constructor(
    private readonly apiConfig: ApiConfigService,
    private readonly managerGrpcClient: ManagerGrpcClient,
  ) {}

  async onModuleInit() {
    const overlayIp = this.getOverlayIpAddress();

    if (!overlayIp) {
      throw Error('unable to get overlayIp');
    }

    this.managerGrpcClient.setUrl(this.apiConfig.manager.url);

    await lastValueFrom(
      this.managerGrpcClient.serviceClient.registerService({
        type: ServiceTypeEnum.NIP05,
        heartbeatDurationInSec: 10,
        url: overlayIp,
        port: this.apiConfig.grpcConfig.port,
        region: this.apiConfig.region,
      }),
    );
  }

  getOverlayIpAddress(): string | null {
    const networkInterfaces = os.networkInterfaces();

    for (const interfaceName in networkInterfaces) {
      const networkInterface = networkInterfaces[interfaceName];

      if (networkInterface) {
        for (const interfaceInfo of networkInterface) {
          if (interfaceInfo.family === 'IPv4' && !interfaceInfo.internal && this.isOverlayIp(interfaceInfo.address)) {
            return interfaceInfo.address;
          }
        }
      }
    }

    return null;
  }

  private isOverlayIp(ip: string): boolean {
    // Reject ingress network: 10.0.0.0/24
    if (ip.startsWith('10.0.0.')) {
      return false;
    }

    // Accept only overlay-like subnets: 10.0.X.X where X >= 1
    const parts = ip.split('.');
    if (parts.length >= 3 && parts[2] !== undefined) {
      const thirdOctet = parseInt(parts[2], 10);
      return !isNaN(thirdOctet) && thirdOctet > 0 && thirdOctet <= 255;
    }

    return false;
  }
}
