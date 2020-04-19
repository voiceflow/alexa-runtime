import { expect } from 'chai';
import sinon from 'sinon';

import PaymentHandler from '@/lib/services/test/handlers/payment';

describe('Test paymentHandler unit tests', () => {
  const paymentHandler = PaymentHandler();

  describe('canHandle', () => {
    it('false', () => {
      expect(paymentHandler.canHandle({} as any, null as any, null as any, null as any)).to.eql(false);
    });

    it('true', () => {
      expect(paymentHandler.canHandle({ product_id: '1' } as any, null as any, null as any, null as any)).to.eql(true);
    });
  });

  describe('handle', () => {
    it('no success_id or fail_id', () => {
      const context = { trace: { debug: sinon.stub() } };
      expect(paymentHandler.handle({} as any, context as any, null as any, null as any)).to.eql(null);
      expect(context.trace.debug.args).to.eql([['__payment__ - entered']]);
    });

    it('success_id', () => {
      const block = { success_id: 'success-id' };
      const context = { trace: { debug: sinon.stub() } };
      expect(paymentHandler.handle(block as any, context as any, null as any, null as any)).to.eql(block.success_id);
      expect(context.trace.debug.args).to.eql([['__payment__ - entered'], ['__payment__ - success path triggered']]);
    });

    it('fail_id', () => {
      const block = { fail_id: 'fail-id' };
      const context = { trace: { debug: sinon.stub() } };
      expect(paymentHandler.handle(block as any, context as any, null as any, null as any)).to.eql(block.fail_id);
      expect(context.trace.debug.args).to.eql([
        ['__payment__ - entered'],
        ['__payment__ - success link is not provided, redirecting to the fail block'],
      ]);
    });
  });
});
