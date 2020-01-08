import { Config, MiddlewareGroup } from '@/types';

import { FullServiceMap } from '../types';
import Example from './example';
import { AbstractMiddleware } from './utils';

export { AbstractMiddleware };

export interface MiddlewareMap {
  example: Example;
}

export interface MiddlewareClass<T = MiddlewareGroup> {
  new (services: FullServiceMap, config: Config): T;
}

export default {
  Example,
};
