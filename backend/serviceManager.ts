/* eslint-disable class-methods-use-this, no-empty-function */

import secretsProvider from '@voiceflow/secrets-provider';

import { buildClients, buildControllers, buildMiddleware, buildServices, ClientMap, ControllerMap, FullServiceMap, MiddlewareMap } from '@/lib';
import { Config } from '@/types';

class ServiceManager {
  clients: ClientMap = null;

  services: FullServiceMap = null;

  middlewares: MiddlewareMap = null;

  controllers: ControllerMap = null;

  constructor(public config: Config) {
    // Clients
    const clients = buildClients(config);

    // Services
    const services = buildServices(config, clients);

    // Middleware
    const middlewares = buildMiddleware(services, config);

    // Controllers
    const controllers = buildControllers(services, config);

    Object.assign(this, {
      clients,
      services,
      middlewares,
      controllers,
    });
  }

  /**
   * Start services
   */
  async start() {}

  /**
   * Stop services
   */
  async stop() {
    await secretsProvider.stop();
  }
}

export default ServiceManager;
