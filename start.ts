import 'core-js';
import 'regenerator-runtime/runtime';

import { ServiceManager } from './backend';
import config from './config';
import log from './logger';
import Server from './server';

(async () => {
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
