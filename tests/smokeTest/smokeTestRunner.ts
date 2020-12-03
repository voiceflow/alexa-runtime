/* eslint-disable no-process-exit */
/* eslint-disable no-console */
import '../../envSetup';

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

const LOG = {
  ERROR: '\x1b[31m%s\x1b[0m',
  DEFAULT: '\x1b[36m%s\x1b[0m',
  SUCCESS: '\x1b[32m%s\x1b[0m',
};

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
      nock(call.scope)
        .intercept(call.path, call.method)
        .reply(call.status, call.response);
    });

    await Promise.each(requests, async ({ request, response }) => {
      try {
        const { data: actualResponse } = await axios(`${SERVER_URL}${request.url}`, {
          method: request.method,
          data: request.body,
          headers: request.headers,
        });

        // get response properties list
        const properties: string[] = [];
        extractProperties(response.body, '', properties);

        // assert that all properties in expected response (old server) are equal in the actual response (new server)
        properties.forEach((prop) => {
          const propPath = prop.substr(1);
          let actual = _.get(actualResponse, propPath);
          let expected = _.get(response.body, propPath);

          if (propPath === 'userAgent') {
            // trim Node version, doesn't need to be the same
            actual = actual.substr(0, 21);
            expected = expected.substr(0, 21);
          }

          expect(actual).to.eql(expected);
        });
      } catch (e) {
        console.error(LOG.ERROR, `Request ${request.url} err: `, e);
        process.exit(1);
      }
    });

    console.log(LOG.SUCCESS, 'correct');
  } catch (err) {
    console.error(LOG.ERROR, `FILE ${filePath} ERR:`, err);
    process.exit(1);
  }
};

const beforeAll = async () => {
  const serviceManager = new ServiceManager(config);
  const server = new Server(serviceManager, config);

  // mock server-data-api token gen
  nock(config.VF_DATA_ENDPOINT)
    .intercept('/generate-platform-token', 'POST')
    .times(2) // TODO: remove after prototypeDataAPI deleted
    .reply(200, { token: 'token' });

  await server.start();

  await awaitServerHealthy(SERVER_URL);

  try {
    // try deleting table, just in case it already exists
    await deleteTable();
  } catch (err) {
    // ignore this failing. means table does not exist
  }

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
      console.log(LOG.DEFAULT, `running test for session: ${file}`);
      await runTest(filePath);

      await afterEach();
    });

    await afterAll({ server });
  } catch (err) {
    console.error(LOG.ERROR, 'FILES LOOP ERR: ', err);
    process.exit(1);
  }
})();
