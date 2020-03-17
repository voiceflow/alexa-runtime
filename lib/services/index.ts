import secretsProvider, { SecretsProvider } from '@voiceflow/secrets-provider';
import ASK from 'ask-sdk';

import { Config } from '@/types';

import { ClientMap } from '../clients';
import Alexa from './alexa';
import Test from './test';
import Voiceflow from './voiceflow';

export interface ServiceMap {
  alexa: ASK.Skill;
  voiceflow: Voiceflow;
  test: Test;
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
  services.voiceflow = new Voiceflow(services, config);
  services.alexa = Alexa(services, config);
  services.test = new Test(services, config);

  return services;
};

export default buildServices;
