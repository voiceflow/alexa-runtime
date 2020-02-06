import Logger from '@voiceflow/logger';

const options = ['local', 'test'].includes(process.env.NODE_ENV || '') ? { level: 'info', stackTrace: true, pretty: true } : {};

const log = new Logger(options);

export default log;
