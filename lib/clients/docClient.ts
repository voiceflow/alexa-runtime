import AWS from 'aws-sdk';

import { Config } from '@/types';

const DocClient = (config: Config) => {
  return config.DYNAMO_ENDPOINT
    ? new AWS.DynamoDB.DocumentClient({
        convertEmptyValues: true,
        endpoint: config.DYNAMO_ENDPOINT,
      })
    : new AWS.DynamoDB.DocumentClient({
        convertEmptyValues: true,
      });
};

export default DocClient;
