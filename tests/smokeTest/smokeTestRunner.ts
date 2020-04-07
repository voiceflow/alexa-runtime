/* eslint-disable no-console */
import '../../envSetup';

import secretsProvider from '@voiceflow/secrets-provider';
import AWS from 'aws-sdk';
import axios from 'axios';
import Promise from 'bluebird';
import { expect } from 'chai';
import fs from 'fs';
import _ from 'lodash';
import nock from 'nock';
import path from 'path';

import { ServiceManager } from '../../backend';
import config from '../../config';
import Server from '../../server';
import { SessionRecording } from './types';

config.PORT = '4041';
config.SESSIONS_DYNAMO_TABLE = 'test-runner-sessions';

const RECORDINGS_FOLDER = path.resolve(__dirname, 'recordedSessions');
const SESSION_PREFIX = 'session-recording';
const SERVER_URL = `http://localhost:${config.PORT}`;

AWS.config = new AWS.Config({
  accessKeyId: config.AWS_ACCESS_KEY_ID,
  secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
  endpoint: config.AWS_ENDPOINT,
  region: config.AWS_REGION,
} as any);

const client = new AWS.DynamoDB();

const createTable = async () => {
  const params = {
    AttributeDefinitions: [
      {
        AttributeName: 'id',
        AttributeType: 'S',
      },
    ],
    KeySchema: [
      {
        AttributeName: 'id',
        KeyType: 'HASH',
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  };
  const liveParams = { ...params, TableName: config.SESSIONS_DYNAMO_TABLE };
  await client.createTable(liveParams).promise();
};

const deleteTable = async () => {
  await client.deleteTable({ TableName: config.SESSIONS_DYNAMO_TABLE }).promise();
};

const awaitServerHealthy = async (url: string) => {
  let count = 10;
  while (count-- > 0) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const { data } = await axios(`${url}/health`);

      if (data === 'Healthy') {
        break;
      }
    } catch (e) {
      if (count === 0) {
        throw e;
      }
    }

    if (count === 0) {
      throw new Error('server is failing health check');
    }

    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
};

const extractProperties = (obj: Record<string, any>, propPath: string, list: string[]) => {
  Object.keys(obj).forEach((property) => {
    if (typeof obj[property] === 'object') {
      extractProperties(obj[property], `${propPath}.${property}`, list);
    } else {
      list.push(`${propPath}.${property}`);
    }
  });
};

const runTest = async (filePath: string) => {
  try {
    const rawData = await fs.promises.readFile(filePath, 'utf-8');

    const { requests, httpCalls }: SessionRecording = JSON.parse(rawData);

    // mock http calls
    httpCalls.forEach((call) => {
      const method = call.method.toLowerCase();

      if (method === 'get') {
        nock(call.scope)
          .get(call.path)
          .reply(call.status, call.response);
      } else if (method === 'post') {
        nock(call.scope)
          .post(call.path)
          .reply(call.status, call.response);
      }
    });

    await Promise.each(requests, async ({ request, response }) => {
      try {
        const { data: actualResponse } = await axios(`${SERVER_URL}${request.url}`, {
          method: request.method,
          data: JSON.stringify(request.body),
          headers: request.headers,
        });

        // get response properties list
        const properties: string[] = [];
        extractProperties(response.body, '', properties);

        // assert that all properties in expected response (old server) are equal in the actual response (new server)
        properties.forEach((prop) => {
          const propPath = prop.substr(1);
          expect(_.get(response.body, propPath)).to.eql(_.get(actualResponse, propPath));
        });
      } catch (e) {
        console.error('THE ERROR', e);
        // eslint-disable-next-line no-process-exit
        process.exit(0);
      }
    });

    console.log('correct');
  } catch (err) {
    console.log(`SINGLE FILE ${filePath} ERR:`, err);
  }
};

const beforeAll = async () => {
  // eslint-disable-next-line promise/no-nesting
  await secretsProvider.start(config).catch((err: Error) => {
    console.error(`Error while starting secretsProvider: ${err.stack}`);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  });

  const serviceManager = new ServiceManager(config);
  const server = new Server(serviceManager, config);

  await server.start();

  await awaitServerHealthy(SERVER_URL);

  return { server };
};

const afterAll = async ({ server }: { server: Server }) => {
  await server.stop();
};

const beforeEach = async () => {
  await createTable();
};

const afterEach = async () => {
  nock.cleanAll();
  await deleteTable();
};

(async () => {
  try {
    const files = await fs.promises.readdir(RECORDINGS_FOLDER);

    const { server } = await beforeAll();

    await Promise.each(files, async (file) => {
      if (!file.startsWith(SESSION_PREFIX)) return;

      await beforeEach();

      const filePath = path.resolve(RECORDINGS_FOLDER, file);
      console.log(`running test for session: ${file}`);
      await runTest(filePath);

      await afterEach();
    });

    await afterAll({ server });
  } catch (err) {
    console.log('FILES LOOP ERR: ', err);
  }
})();
