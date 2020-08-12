import Logger from '@voiceflow/logger';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Level } from 'pino'; // We are only using the types here

const infoLevel: Level = 'info';
const warnLevel: Level = 'warn';
const options = ['local', 'test'].includes(process.env.NODE_ENV || '')
  ? { level: infoLevel, stackTrace: true, pretty: true, middlewareVerbosity: 'short' }
  : { level: warnLevel, stackTrace: true, pretty: false, middlewareVerbosity: 'full' };

const log = new Logger(options);

export default log;
