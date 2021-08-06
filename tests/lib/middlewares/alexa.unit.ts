import { expect } from 'chai';
import sinon from 'sinon';

import AlexaMiddleware from '@/lib/middlewares/alexa';

describe('Alexa Middleware test', () => {
  describe('verifier', () => {
    it('test env', async () => {
      const alexaVerifier = { verify: sinon.stub().resolves() };
      const services = {
        alexaVerifiers: [alexaVerifier],
      };
      const next = sinon.stub();
      const { verifier } = new AlexaMiddleware(services as any, { NODE_ENV: 'test' } as any);
      const req = { body: '{"a":1}' };
      await verifier(req, null, next);
      expect(req.body).to.eql({ a: 1 });
      expect(next.callCount).to.eql(1);
      expect(alexaVerifier.verify.callCount).to.eq(0);
    });

    it('normal env', async () => {
      const next = sinon.stub();
      const alexaVerifier = { verify: sinon.stub().resolves() };
      const services = {
        alexaVerifiers: [alexaVerifier, alexaVerifier],
      };

      const { verifier } = new AlexaMiddleware(services as any, { NODE_ENV: 'not-test' } as any);
      const resolvedBody = { a: 1 };
      const stringBody = JSON.stringify(resolvedBody);
      const req = { body: stringBody, headers: 1 };
      await verifier(req, null, next);
      expect(req.body).to.eql(resolvedBody);

      expect(next.callCount).to.eql(1);
      expect(alexaVerifier.verify.args).to.eql([
        [stringBody, req.headers],
        [stringBody, req.headers],
      ]);
    });

    it('verify fails', async () => {
      const next = sinon.stub();
      const alexaVerifier = { verify: sinon.stub().rejects() };
      const services = {
        alexaVerifiers: [alexaVerifier],
      };

      const { verifier } = new AlexaMiddleware(services as any, { NODE_ENV: 'not-test' } as any);
      const resolvedBody = { a: 1 };
      const stringBody = JSON.stringify(resolvedBody);
      const req = { body: stringBody, headers: 1 };
      const res = { status: sinon.stub().returns({ json: () => null }) };
      await verifier(req, res, next);
      expect(req.body).to.eql(resolvedBody);

      expect(next.callCount).to.eql(0);
      expect(res.status.args).to.eql([[400]]);
      expect(alexaVerifier.verify.args).to.eql([[stringBody, req.headers]]);
    });

    it('invalid json', async () => {
      const next = sinon.stub();
      const alexaVerifier = { verify: sinon.stub().rejects() };
      const services = {
        alexaVerifiers: [alexaVerifier, alexaVerifier],
      };

      const { verifier } = new AlexaMiddleware(services as any, { NODE_ENV: 'not-test' } as any);
      const badBody = '{{}/ds<>BAD JSON; }';
      const req = { body: badBody, headers: 1 };
      const res = { status: sinon.stub().returns({ json: () => null }) };
      await verifier(req, res, next);
      expect(req.body).to.eql(badBody);

      expect(next.callCount).to.eql(0);
      expect(res.status.args).to.eql([[400]]);
      expect(alexaVerifier.verify.callCount).to.eq(0);
    });
  });
});
