import { Config, Controller } from '@/types';

import { FullServiceMap } from '../types';
import Example from './example';
import { AbstractController } from './utils';

export { AbstractController };

export interface ControllerMap {
  example: Example;
}

export interface ControllerClass<T = Controller> {
  new (services: FullServiceMap, config: Config): T;
}

export default {
  Example,
};
