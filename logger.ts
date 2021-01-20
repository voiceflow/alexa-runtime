import Logger, { LogLevel, MiddlewareVerbosity } from '@voiceflow/logger';

import config from './config';

const LogLevels = new Set<string>(Object.keys(LogLevel));

const log = new Logger({
  level: (LogLevels.has(config.LOG_LEVEL!) && (config.LOG_LEVEL as LogLevel)) || null,
  stackTrace: true,
  pretty: ['local', 'test'].includes(process.env.NODE_ENV || ''),
  middlewareVerbosity: config.MIDDLEWARE_VERBOSITY as MiddlewareVerbosity,
});

export default log;
