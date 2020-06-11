import { expect } from 'chai';
import sinon from 'sinon';

import AlexaMiddleware from '@/lib/middlewares/alexa';

describe('Alexa Middleware test', () => {
  describe('verifier', () => {
    it('test env', () => {
      const next = sinon.stub();
      const { verifier } = new AlexaMiddleware(null as any, { NODE_ENV: 'test' } as any);
      verifier(null as any, null as any, next);
      expect(next.callCount).to.eql(1);
    });

    it('has body', () => {
      const { verifier } = new AlexaMiddleware(null as any, { NODE_ENV: 'not-test' } as any);
      const req = {
        _body: 'blah',
      };
      const resJson = sinon.stub();
      const res = {
        status: sinon.stub().returns({ json: resJson }),
      };
      verifier(req as any, res as any, null as any);
      expect(res.status.args[0][0]).to.eq(400);
      expect(resJson.args[0][0]).to.eql({ status: 'failure', reason: 'The raw request body has already been parsed.' });
    });

    // it('normal env', () => {
    //   const { verifier } = new AlexaMiddleware(null as any, { NODE_ENV: 'not-test' } as any);
    //   const req = {

    //   }
    //   verifier()
    //   expect(verifier).to.
    // });
  });
});
