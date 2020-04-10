import secretsProvider, { SecretsProvider } from '@voiceflow/secrets-provider';

import { Config } from '@/types';

import { ClientMap } from '../clients';
import Alexa from './alexa';
import Test from './test';
import Voiceflow from './voiceflow';

export interface ServiceMap {
  alexa: ReturnType<typeof Alexa>;
  voiceflow: ReturnType<typeof Voiceflow>;
  test: ReturnType<typeof Test>;
}

export interface FullServiceMap extends ClientMap, ServiceMap {
  secretsProvider: SecretsProvider;
}

/**
 * Build all services
 */
const buildServices = (config: Config, clients: ClientMap): FullServiceMap => {
  const services = {
    ...clients,
  } as FullServiceMap;

  services.secretsProvider = secretsProvider;
  services.voiceflow = Voiceflow(services, config);
  services.alexa = Alexa(services, config);
  services.test = Test(services, config);

  return services;
};

export default buildServices;
