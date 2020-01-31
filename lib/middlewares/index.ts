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
const buildMiddleware = (services: FullServiceMap, config: Config): MiddlewareMap => ({
  alexa: new Alexa(services, config),
});

export default buildMiddleware;
