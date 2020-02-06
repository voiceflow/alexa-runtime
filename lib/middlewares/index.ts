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

  middlewares.alexa = new Alexa(services, config);
  // everything before this will be route-wrapped
  routeWrapper(middlewares);

  return middlewares;
};

export default buildMiddleware;
