import { expect } from 'chai';
import sinon from 'sinon';
import request from 'supertest';

import GetApp from '../getAppForTest';
import fixtures from './fixture';

const tests = [
  {
    method: 'get',
    calledPath: '/example/:id',
    expected: {
      controllers: {
        example: {
          getExample: 1,
        },
      },
      middlewares: {
        example: {
          checkExample: 1,
        },
      },
      validations: {
        controllers: {
          example: {
            getExample: {
              PARAMS_ID: 1,
            },
          },
        },
      },
    },
  },
];

describe('example route unit tests', () => {
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
