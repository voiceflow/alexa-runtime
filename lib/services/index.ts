import { Config } from '@/types';

import { ClientMap } from '../clients';
import Adapter from './adapter';
import Alexa from './alexa';
import Test from './test';
import Voiceflow from './voiceflow';

export interface ServiceMap {
  adapter: Adapter;
  alexa: ReturnType<typeof Alexa>;
  voiceflow: ReturnType<typeof Voiceflow>;
  test: ReturnType<typeof Test>;
}

export interface FullServiceMap extends ClientMap, ServiceMap {}

/**
 * Build all services
 */
const buildServices = (config: Config, clients: ClientMap): FullServiceMap => {
  const services = {
    ...clients,
  } as FullServiceMap;

  services.voiceflow = Voiceflow(services, config);
  services.adapter = new Adapter(services, config);
  services.alexa = Alexa(services, config);
  services.test = Test(services, config);

  return services;
};

export default buildServices;
