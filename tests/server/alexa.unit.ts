import { expect } from 'chai';
import sinon from 'sinon';
import request from 'supertest';

import GetApp from '../getAppForTest';
import fixtures from './fixture';

const tests = [
  {
    method: 'post',
    calledPath: '/state/skill/:versionID',
    expected: {
      controllers: {
        alexa: {
          handler: 1,
        },
      },
      middlewares: {
        alexa: {
          verifier: 1,
        },
      },
      validations: {
        controllers: {
          alexa: {
            handler: {
              VERSION_ID: 1,
            },
          },
        },
      },
    },
  },
];

describe('alexa route unit tests', () => {
  let app;
  let server;

  afterEach(async () => {
    sinon.restore();
    await server.stop();
  });

  tests.forEach((test) => {
    it(`${test.method} ${test.calledPath}`, async () => {
      const fixture = await fixtures.createFixture();
      ({ app, server } = await GetApp(fixture));

      const response = await request(app)[test.method](test.calledPath);

      fixtures.checkFixture(fixture, test.expected);
      expect(response.body).to.eql({ done: 'done' });
    });
  });
});
