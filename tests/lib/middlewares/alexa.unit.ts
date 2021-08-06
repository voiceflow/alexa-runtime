import { expect } from 'chai';
import sinon from 'sinon';

import AlexaMiddleware, { AlexaVerifierMiddleware } from '@/lib/middlewares/alexa';

describe('Alexa Middleware test', () => {
  describe('verifier', () => {
    it('test env', () => {
      const next = sinon.stub();
      const { verifier } = new AlexaMiddleware(null as any, { NODE_ENV: 'test' } as any);
      verifier(null, null, next);
      expect(next.callCount).to.eql(1);
      expect(verifier).to.not.eq(AlexaVerifierMiddleware);
    });

    it('normal env', () => {
      const { verifier } = new AlexaMiddleware(null as any, { NODE_ENV: 'not-test' } as any);
      expect(verifier).to.eql(AlexaVerifierMiddleware);
    });
  });
});
