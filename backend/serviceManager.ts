/* eslint-disable class-methods-use-this, no-empty-function */
import { buildClients, buildControllers, buildMiddleware, buildServices, ClientMap, ControllerMap, FullServiceMap, MiddlewareMap } from '@/lib';
import { Config } from '@/types';

class ServiceManager {
  clients: ClientMap;

  services: FullServiceMap;

  middlewares: MiddlewareMap;

  controllers: ControllerMap;

  constructor(public config: Config) {
    // Clients
    this.clients = buildClients(config);

    // Services
    this.services = buildServices(config, this.clients);

    // Middleware
    this.middlewares = buildMiddleware(this.services, config);

    // Controllers
    this.controllers = buildControllers(this.services, config);
  }

  /**
   * Start services
   */
  async start() {
    // needed for eslint
  }

  /**
   * Stop services
   */
  async stop() {
    // needed for eslint
  }
}

export default ServiceManager;
