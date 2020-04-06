/* eslint-disable no-console */
/* eslint-disable promise/always-return, no-await-in-loop */

import secretsProvider from '@voiceflow/secrets-provider';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { expect } from 'chai';
import fetch from 'cross-fetch';
import fs from 'fs';
import _ from 'lodash';
import yargs from 'yargs';

import { Config } from '../../types';
import { SessionRecording } from './types';

const SERVER_CONFIG: Config = {
  NODE_ENV: 'test',
  PORT: '4041',

  AWS_ACCESS_KEY_ID: 'null',
  AWS_SECRET_ACCESS_KEY: 'null',
  AWS_REGION: 'localhost',
  AWS_ENDPOINT: 'http://localhost:8000',

  DYNAMO_ENDPOINT: 'http://localhost:8000',

  // Secrets configuration
  SECRETS_PROVIDER: 'test',
  API_KEYS_SECRET: null,
  MAIN_DB_SECRET: null,
  LOGGING_DB_SECRET: null,

  // Release information
  GIT_SHA: null,
  BUILD_NUM: null,
  SEM_VER: null,
  BUILD_URL: null,

  // diagrams table
  SESSIONS_DYNAMO_TABLE: 'com.getvoiceflow.test.sessions',

  VF_DATA_ENDPOINT: 'http://localhost:8200',
};

const { argv } = yargs.option('f', {
  alias: 'file',
  demandOption: true,
  type: 'string',
});

const awaitServerHealthy = async (url: string) => {
  let count = 10;
  while (count-- > 0) {
    try {
      const data = await (await fetch(`${url}/health`)).text();

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

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
};

const extractProperties = (obj: Record<string, any>, path: string, list: string[]) => {
  // eslint-disable-next-line no-restricted-syntax
  Object.keys(obj).forEach((property) => {
    if (typeof obj[property] === 'object') {
      extractProperties(obj[property], `${path}.${property}`, list);
    } else {
      list.push(`${path}.${property}`);
    }
  });
};

fs.promises
  .readFile(argv.f, 'utf-8')
  .then(async (rawData) => {
    const { requests, httpCalls }: SessionRecording = JSON.parse(rawData);

    const mock = new MockAdapter(axios);

    httpCalls.forEach((call) => {
      const { method } = call.request;
      const mockFn = _.get(mock, `on${method[0].toUpperCase()}${method.slice(1)}`).bind(mock);
      mockFn(call.request.url, call.request.data).reply(200, call.response.data);
    });

    await import('../../envSetup');
    const { default: Server } = await import('../../server');
    const { ServiceManager } = await import('../../backend');

    // eslint-disable-next-line promise/no-nesting
    await secretsProvider.start(SERVER_CONFIG).catch((err: Error) => {
      console.error(`Error while starting secretsProvider: ${err.stack}`);
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    });

    const serviceManager = new ServiceManager(SERVER_CONFIG);
    const server = new Server(serviceManager, SERVER_CONFIG);

    await server.start();

    const serverURL = `http://localhost:${SERVER_CONFIG.PORT}`;

    await awaitServerHealthy(serverURL);

    // eslint-disable-next-line no-restricted-syntax
    for (const { request, response } of requests) {
      try {
        const actualResponse = await (
          await fetch(`${serverURL}${request.url}`, {
            method: request.method,
            body: JSON.stringify(request.body),
            headers: request.headers,
          })
        ).json();

        // get response properties list
        const properties: string[] = [];
        extractProperties(response.body, '', properties);

        // assert that all properties in expected response (old server) are equal in the actual response (new server)
        properties.forEach((prop) => {
          const path = prop.substr(1);
          expect(_.get(response.body, path)).to.eql(_.get(actualResponse, path));
        });
      } catch (e) {
        console.error('THE ERROR', e);
      }
    }

    console.log('correct');
    // eslint-disable-next-line no-process-exit
    process.exit(0);
  })
  .catch((e) => console.error('THE ERROR', e));
