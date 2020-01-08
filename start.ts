import 'core-js';
import 'regenerator-runtime/runtime';
import './envSetup';

import secretsProvider from '@voiceflow/secrets-provider';

import { ServiceManager } from './backend';
import config from './config';
import log from './logger';
import Server from './server';

(async () => {
  // Have to start secrets provider before creating serviceManager
  // serviceManager will make sync get() calls to secretsProvider during its construction, and the secrets have to be populated
  await secretsProvider.start(config).catch((err: Error) => {
    log.error(`Error while starting secretsProvider: ${err.stack}`);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  });

  const serviceManager = new ServiceManager(config);
  const server = new Server(serviceManager, config);

  // Graceful shutdown from SIGTERM
  process.on('SIGTERM', async () => {
    log.warn('SIGTERM received stopping server...');

    await server.stop();
    // eslint-disable-next-line no-process-exit
    process.exit(0);
  });

  process.on('unhandledRejection', (r, p) => {
    log.warn(r, 'Unhandled rejection at: ', p);
  });

  try {
    await server.start();
  } catch (e) {
    log.error('Failed to start server');
    log.error(e);
  }
})();
