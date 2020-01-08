import '@/envSetup';

import secretsProvider from '@voiceflow/secrets-provider';

import { ServiceManager } from '@/backend';
import config from '@/config';
import Server from '@/server';

export default async (serviceManager: ServiceManager) => {
  if (!serviceManager) {
    await secretsProvider.start(config);
    serviceManager = new ServiceManager(config);
  }
  const server = new Server(serviceManager, config);

  await server.start();
  const { app } = server;

  return {
    app,
    server,
  };
};
