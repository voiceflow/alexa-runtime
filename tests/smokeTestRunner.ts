/* eslint-disable promise/always-return, no-await-in-loop */

import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import fetch from 'cross-fetch';
import fs from 'fs';
import path from 'path';
import yargs from 'yargs';

import { SessionRecording } from './types';

const { argv } = yargs.option('f', {
  alias: 'file',
  demandOption: true,
  type: 'string',
});

// eslint-disable-next-line promise/catch-or-return
fs.promises
  .readFile(argv.f, 'utf-8')
  .then(async (rawData) => {
    const { requests, fixtures }: SessionRecording = JSON.parse(rawData);

    const mock = new MockAdapter(axios);

    Object.keys(fixtures.diagrams).forEach((diagramID) => {
      const diagram = fixtures.diagrams[diagramID];

      mock.onGet(`/diagrams/${diagramID}`).reply(200, diagram);
    });

    await import('../start');

    const serverURL = `http://localhost:${process.env.PORT}`;

    let count = 10;
    while (count-- > 0) {
      try {
        const data = await (await fetch(`${serverURL}/health`)).text();

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

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const { request, response } of requests) {
      try {
        const actualResponse = await fetch(`${serverURL}/state/skill/${path.basename(request.url)}`, {
          method: 'post',
          body: JSON.stringify(request.body),
        });

        console.log(response, actualResponse);
      } catch (e) {
        console.error(e);
      }
    }
  })
  .catch((e) => console.error(e));
