import './envSetup';

import { getOptionalProcessEnv, getRequiredProcessEnv } from '@voiceflow/backend-utils';

import { Config } from './types';

const NODE_ENV = getRequiredProcessEnv('NODE_ENV');
const CLOUD_ENV = getOptionalProcessEnv('CLOUD_ENV', 'public');

const CONFIG: Config = {
  NODE_ENV,
  PORT: getRequiredProcessEnv('PORT'),
  PORT_METRICS: getOptionalProcessEnv('PORT_METRICS'),
  CLOUD_ENV,
  ERROR_RESPONSE_MS: Number(getOptionalProcessEnv('ERROR_RESPONSE_MS', (10 * 1000).toString())),
  IS_PRIVATE_CLOUD: NODE_ENV === 'production' && CLOUD_ENV !== 'public',
  PRIVATE_LOGS: !!getOptionalProcessEnv('PRIVATE_LOGS', false.toString()),

  AWS_ACCESS_KEY_ID: getOptionalProcessEnv('AWS_ACCESS_KEY_ID'),
  AWS_SECRET_ACCESS_KEY: getOptionalProcessEnv('AWS_SECRET_ACCESS_KEY'),
  AWS_REGION: getOptionalProcessEnv('AWS_REGION'),
  AWS_ENDPOINT: getOptionalProcessEnv('AWS_ENDPOINT'),

  // Application secrets
  ADMIN_SERVER_DATA_API_TOKEN: getRequiredProcessEnv('ADMIN_SERVER_DATA_API_TOKEN'),
  DATADOG_API_KEY: getRequiredProcessEnv('DATADOG_API_KEY'),

  DYNAMO_ENDPOINT: getOptionalProcessEnv('DYNAMO_ENDPOINT'),
  CODE_HANDLER_ENDPOINT: getOptionalProcessEnv('CODE_HANDLER_ENDPOINT'),
  INTEGRATIONS_HANDLER_ENDPOINT: getRequiredProcessEnv('INTEGRATIONS_HANDLER_ENDPOINT'),
  API_HANDLER_ENDPOINT: getOptionalProcessEnv('API_HANDLER_ENDPOINT'),

  // Release information
  GIT_SHA: getOptionalProcessEnv('GIT_SHA'),
  BUILD_NUM: getOptionalProcessEnv('BUILD_NUM'),
  SEM_VER: getOptionalProcessEnv('SEM_VER'),
  BUILD_URL: getOptionalProcessEnv('BUILD_URL'),

  // diagrams table
  SESSIONS_DYNAMO_TABLE: getRequiredProcessEnv('SESSIONS_DYNAMO_TABLE'),

  VF_DATA_ENDPOINT: getRequiredProcessEnv('VF_DATA_ENDPOINT'),

  // Logging
  LOG_LEVEL: getOptionalProcessEnv('LOG_LEVEL'),
  MIDDLEWARE_VERBOSITY: getOptionalProcessEnv('MIDDLEWARE_VERBOSITY'),

  PROJECT_SOURCE: getOptionalProcessEnv('PROJECT_SOURCE'),
  SESSIONS_SOURCE: getOptionalProcessEnv('SESSIONS_SOURCE'),

  MONGO_URI: getOptionalProcessEnv('MONGO_URI'),
  MONGO_DB: getOptionalProcessEnv('MONGO_DB'),

  // postgres sessions store
  PG_USERNAME: getOptionalProcessEnv('PG_USERNAME'),
  PG_HOST: getOptionalProcessEnv('PG_HOST'),
  PG_DBNAME: getOptionalProcessEnv('PG_DBNAME'),
  PG_PASSWORD: getOptionalProcessEnv('PG_PASSWORD'),
  PG_PORT: getOptionalProcessEnv('PG_PORT'),

  CONFIG_ID_HASH: getOptionalProcessEnv('CONFIG_ID_HASH'),

  ANALYTICS_ENDPOINT: getOptionalProcessEnv('ANALYTICS_ENDPOINT') || null,
  ANALYTICS_WRITE_KEY: getOptionalProcessEnv('ANALYTICS_WRITE_KEY') || null,

  INGEST_WEBHOOK_ENDPOINT: getOptionalProcessEnv('INGEST_WEBHOOK_ENDPOINT') || null,
};

export default CONFIG;
