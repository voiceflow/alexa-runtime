import { routeWrapper } from '@/lib/utils';
import { Config, MiddlewareGroup } from '@/types';

import { FullServiceMap } from '../services';
import Alexa from './alexa';

export interface MiddlewareMap {
  alexa: Alexa;
}

export interface MiddlewareClass<T = MiddlewareGroup> {
  new (services: FullServiceMap, config: Config): T;
}

/**
 * Build all middlewares
 */
const buildMiddleware = (services: FullServiceMap, config: Config) => {
  const middlewares = {} as MiddlewareMap;

  // everything before this will be route-wrapped
  routeWrapper(middlewares);

  middlewares.alexa = new Alexa(services, config);

  return middlewares;
};

export default buildMiddleware;
