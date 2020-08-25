import Logger from '@voiceflow/logger';

import config from './config';

const log = new Logger({
  level: config.LOG_LEVEL,
  stackTrace: true,
  pretty: ['local', 'test'].includes(process.env.NODE_ENV || ''),
  middlewareVerbosity: config.MIDDLEWARE_VERBOSITY,
});

export default log;
