import Client from '@voiceflow/client';
import secretsProvider, { SecretsProvider } from '@voiceflow/secrets-provider';
import ASK from 'ask-sdk';

import { Config } from '@/types';

import { ClientMap } from '../clients';
import Alexa from './alexa';
import Voiceflow, { Block } from './voiceflow';

export interface ServiceMap {
  alexa: ASK.Skill;
  voiceflow: Client<Block>;
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

  return services;
};

export default buildServices;
