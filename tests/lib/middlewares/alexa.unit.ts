import AlexaVerifier from 'alexa-verifier-middleware';
import { expect } from 'chai';
import sinon from 'sinon';

import AlexaMiddleware from '@/lib/middlewares/alexa';

describe('Alexa Middleware test', () => {
  describe('verifier', () => {
    it('test env', () => {
      const next = sinon.stub();
      const { verifier } = new AlexaMiddleware(null as any, { NODE_ENV: 'test' } as any);
      verifier(null, null, next);
      expect(next.callCount).to.eql(1);
      expect(verifier).to.not.eq(AlexaVerifier);
    });

    it('normal env', () => {
      const { verifier } = new AlexaMiddleware(null as any, { NODE_ENV: 'not-test' } as any);
      expect(verifier).to.eql(AlexaVerifier);
    });
  });
});
