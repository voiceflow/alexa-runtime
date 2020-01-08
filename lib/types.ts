import { SecretsProvider } from '@voiceflow/secrets-provider';
import AWS from 'aws-sdk';
import { AxiosStatic } from 'axios';
import pg from 'pg';

import { ServiceMap } from './services';

export interface ClientMap {
  docClient: AWS.DynamoDB.DocumentClient;
  pool: pg.Pool;
  axios: AxiosStatic;
}

export interface FullServiceMap extends ClientMap, ServiceMap {
  secretsProvider: SecretsProvider;
}
