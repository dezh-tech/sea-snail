import path from 'node:path';
import { ChannelCredentials } from '@grpc/grpc-js';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc, ClientOptions, ClientProxyFactory, Transport } from '@nestjs/microservices';
import {
  MANAGER_V1_PACKAGE_NAME,
  ServiceRegistryClient,
  SERVICE_REGISTRY_SERVICE_NAME,
} from './gen/ts/service_registry';

@Injectable()
export class ManagerGrpcClient implements OnModuleInit {
  static instance: ManagerGrpcClient;

  private clientGrpc: ClientGrpc;
  public serviceClient: ServiceRegistryClient;

  private isSecure = false;
  private url = '';

  constructor() {
    ManagerGrpcClient.instance = this;
    this.initializeClient();
  }

  setUrl(url: string, isSecure = false): void {
    if (this.url !== url) {
      this.url = url;
      this.isSecure = isSecure;

      this.initializeClient();
    }
  }

  private initializeClient(): void {
    const clientOptions: ClientOptions = {
      transport: Transport.GRPC,
      options: {
        url: this.url,
        package: MANAGER_V1_PACKAGE_NAME,
        protoPath: path.join(__dirname, 'proto', 'service_registry.proto'),
        credentials: this.isSecure ? ChannelCredentials.createSsl() : ChannelCredentials.createInsecure(),
      },
    };

    this.clientGrpc = ClientProxyFactory.create(clientOptions) as unknown as ClientGrpc;
    this.serviceClient = this.clientGrpc.getService<ServiceRegistryClient>(SERVICE_REGISTRY_SERVICE_NAME);
  }

  onModuleInit(): void {
    this.serviceClient = this.clientGrpc.getService<ServiceRegistryClient>(SERVICE_REGISTRY_SERVICE_NAME);
  }
}
