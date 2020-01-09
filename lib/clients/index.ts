import AWS from 'aws-sdk';
import { AxiosStatic } from 'axios';

import { Config } from '@/types';

import DocClient from './docClient';
import Static from './static';

export interface ClientMap {
  docClient: AWS.DynamoDB.DocumentClient;
  axios: AxiosStatic;
}

/**
 * Build all clients
 */
const buildClients = (config: Config) => {
  const clients = { ...Static } as ClientMap;

  clients.docClient = DocClient(config);

  return clients;
};

export default buildClients;
