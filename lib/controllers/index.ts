import { Config, Controller } from '@/types';

import { FullServiceMap } from '../services';
import Alexa from './alexa';

export interface ControllerMap {
  alexa: Alexa;
}

export interface ControllerClass<T = Controller> {
  new (services: FullServiceMap, config: Config): T;
}

/**
 * Build all controllers
 */
const buildControllers = (services: FullServiceMap, config: Config): ControllerMap => {
  return {
    alexa: new Alexa(services, config),
  };
};

export default buildControllers;
