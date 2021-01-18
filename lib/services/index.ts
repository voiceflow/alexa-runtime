import { Config } from '@/types';

import { ClientMap } from '../clients';
import Adapter from './adapter';
import Alexa from './alexa';
import Runtime from './runtime';
import Test from './test';

export interface ServiceMap {
  test: ReturnType<typeof Test>;
  alexa: ReturnType<typeof Alexa>;
  adapter: Adapter;
  runtimeClient: ReturnType<typeof Runtime>;
}

export interface FullServiceMap extends ClientMap, ServiceMap {}

/**
 * Build all services
 */
const buildServices = (config: Config, clients: ClientMap): FullServiceMap => {
  const services = {
    ...clients,
  } as FullServiceMap;

  services.runtimeClient = Runtime(services, config);
  services.adapter = new Adapter(services, config);
  services.alexa = Alexa(services, config);
  services.test = Test(services, config);

  return services;
};

export default buildServices;
