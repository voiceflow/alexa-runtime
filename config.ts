import './envSetup';

import * as Common from '@voiceflow/common';

import { Config } from './types';

const { getProcessEnv, hasProcessEnv } = Common.utils.general;

const optionalProcessEnv = (name: string) => (hasProcessEnv(name) ? getProcessEnv(name) : null);

const CONFIG: Config = {
  NODE_ENV: getProcessEnv('NODE_ENV'),
  PORT: getProcessEnv('PORT'),

  AWS_ACCESS_KEY_ID: optionalProcessEnv('AWS_ACCESS_KEY_ID'),
  AWS_SECRET_ACCESS_KEY: optionalProcessEnv('AWS_SECRET_ACCESS_KEY'),
  AWS_REGION: optionalProcessEnv('AWS_REGION'),
  AWS_ENDPOINT: optionalProcessEnv('AWS_ENDPOINT'),

  // Application secrets
  ADMIN_SERVER_DATA_API_TOKEN: getProcessEnv('ADMIN_SERVER_DATA_API_TOKEN'),
  DATADOG_API_KEY: getProcessEnv('DATADOG_API_KEY'),

  DYNAMO_ENDPOINT: optionalProcessEnv('DYNAMO_ENDPOINT'),
  CODE_HANDLER_ENDPOINT: getProcessEnv('CODE_HANDLER_ENDPOINT'),
  INTEGRATIONS_HANDLER_ENDPOINT: getProcessEnv('INTEGRATIONS_HANDLER_ENDPOINT'),
  API_HANDLER_ENDPOINT: getProcessEnv('API_HANDLER_ENDPOINT'),

  // Release information
  GIT_SHA: optionalProcessEnv('GIT_SHA'),
  BUILD_NUM: optionalProcessEnv('BUILD_NUM'),
  SEM_VER: optionalProcessEnv('SEM_VER'),
  BUILD_URL: optionalProcessEnv('BUILD_URL'),

  // diagrams table
  SESSIONS_DYNAMO_TABLE: getProcessEnv('SESSIONS_DYNAMO_TABLE'),

  VF_DATA_ENDPOINT: getProcessEnv('VF_DATA_ENDPOINT'),

  // Logging
  LOG_LEVEL: optionalProcessEnv('LOG_LEVEL'),
  MIDDLEWARE_VERBOSITY: optionalProcessEnv('MIDDLEWARE_VERBOSITY'),

  PROJECT_SOURCE: optionalProcessEnv('PROJECT_SOURCE'),
  SESSIONS_SOURCE: optionalProcessEnv('SESSIONS_SOURCE'),

  MONGO_URI: optionalProcessEnv('MONGO_URI'),
  MONGO_DB: optionalProcessEnv('MONGO_DB'),

  // postgres sessions store
  PG_USERNAME: optionalProcessEnv('PG_USERNAME'),
  PG_HOST: optionalProcessEnv('PG_HOST'),
  PG_DBNAME: optionalProcessEnv('PG_DBNAME'),
  PG_PASSWORD: optionalProcessEnv('PG_PASSWORD'),
  PG_PORT: optionalProcessEnv('PG_PORT'),

  CONFIG_ID_HASH: optionalProcessEnv('CONFIG_ID_HASH'),
};

export default CONFIG;
