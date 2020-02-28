import { routeWrapper } from '@/lib/utils';
import { Config, Controller } from '@/types';

import { FullServiceMap } from '../services';
import Alexa from './alexa';
import Test from './test';

export interface ControllerMap {
  alexa: Alexa;
  test: Test;
}

export interface ControllerClass<T = Controller> {
  new (services: FullServiceMap, config: Config): T;
}

/**
 * Build all controllers
 */
const buildControllers = (services: FullServiceMap, config: Config) => {
  const controllers = {} as ControllerMap;

  controllers.alexa = new Alexa(services, config);
  controllers.test = new Test(services, config);

  // everything before this will be route-wrapped
  routeWrapper(controllers);

  return controllers;
};

export default buildControllers;
