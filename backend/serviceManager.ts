/* eslint-disable class-methods-use-this, no-empty-function */

import { ResponseBuilder } from '@voiceflow/backend-utils';
import secretsProvider from '@voiceflow/secrets-provider';
import AWS from 'aws-sdk';
import axios from 'axios';
import _ from 'lodash';
import pg from 'pg';

import {
  AbstractController,
  AbstractMiddleware,
  ClientMap,
  ControllerMap,
  Controllers,
  FullServiceMap,
  MiddlewareMap,
  Middlewares,
  ServiceMap,
  Services,
} from '@/lib';
import { getMethods } from '@/lib/utils';
import { Config } from '@/types';

const responseBuilder = new ResponseBuilder();

class ServiceManager {
  clients: ClientMap = null;

  services: ServiceMap = null;

  middlewares: MiddlewareMap = null;

  controllers: ControllerMap = null;

  constructor(public config: Config) {
    // Clients
    const clients = ServiceManager.buildClients(config);

    // Services
    const services = ServiceManager.buildServices(config, clients);

    // Middleware
    const middlewares = ServiceManager.buildMiddleware(services, config);

    // Controllers
    const controllers = ServiceManager.buildControllers(services, config);

    Object.assign(this, {
      clients,
      services,
      middlewares,
      controllers,
    });
  }

  /**
   * Build all controllers
   */
  static buildControllers(services: FullServiceMap, config: Config) {
    const controllers = {};

    const routeWrapper = <T extends AbstractController>(methods: string[], controller: T) => {
      methods.forEach((key) => {
        if (typeof controller[key] === 'function' && !controller[key].route) {
          const routeHandler = controller[key].bind(controller);
          routeHandler.validations = controller[key].validations;

          controller[key] = responseBuilder.route(routeHandler);
        }
      });

      return controller;
    };

    Object.entries(Controllers).forEach(([name, Controller]) => {
      // convert to camelcase
      name = _.camelCase(name);

      controllers[name] = routeWrapper(
        getMethods(Controller),
        new Controller(
          {
            ...services,
          },
          config
        )
      );
    });

    return {
      ...controllers,
    } as ControllerMap;
  }

  /**
   * Build all middlewares
   */
  static buildMiddleware(services: FullServiceMap, config: Config) {
    const middlewares = {};

    const routeWrapper = <T extends AbstractMiddleware>(methods: string[], middleware: T) => {
      methods.forEach((key) => {
        if (typeof middleware[key] === 'function' && !middleware[key].route) {
          const routeHandler = middleware[key].bind(middleware);
          routeHandler.validations = middleware[key].validations;
          routeHandler.callback = middleware[key].callback;

          middleware[key] = responseBuilder.route(routeHandler);
        }
      });

      return middleware;
    };

    Object.entries(Middlewares).forEach(([name, Middleware]) => {
      name = _.camelCase(name);

      middlewares[name] = routeWrapper(
        getMethods(Middleware),
        new Middleware(
          {
            ...services,
          },
          config
        )
      );
    });

    return middlewares as MiddlewareMap;
  }

  /**
   * Build all services
   */
  static buildServices(config: Config, clients: ClientMap) {
    const services = {
      ...clients,
    } as FullServiceMap;

    // Do not reorder these! Creation needs to happen in a fixed order
    services.secretsProvider = secretsProvider;
    services.exampleManager = new Services.ExampleManager({ ...services }, config);

    return services;
  }

  /**
   * Build all clients
   */
  static buildClients(config: Config) {
    const docClient = config.DYNAMO_ENDPOINT
      ? new AWS.DynamoDB.DocumentClient({
          convertEmptyValues: true,
          endpoint: config.DYNAMO_ENDPOINT,
        })
      : new AWS.DynamoDB.DocumentClient({
          convertEmptyValues: true,
        });

    const mainDbConfig = secretsProvider.get('MAIN_DB');
    const pool = new pg.Pool({
      user: mainDbConfig.username,
      host: mainDbConfig.host,
      database: mainDbConfig.dbname,
      password: mainDbConfig.password,
      port: mainDbConfig.port,
    });

    return {
      docClient,
      pool,
      axios,
    };
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
