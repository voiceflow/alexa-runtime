import { expect } from 'chai';
import sinon from 'sinon';

import CancelPaymentHandler from '@/lib/services/test/handlers/cancelPayment';

describe('Test cancelPaymentHandler unit tests', () => {
  const cancelPaymentHandler = CancelPaymentHandler();
  describe('canHandle', () => {
    it('false', () => {
      expect(cancelPaymentHandler.canHandle({} as any, null as any, null as any, null as any)).to.eql(false);
    });

    it('true', () => {
      expect(cancelPaymentHandler.canHandle({ cancel_product_id: '1' } as any, null as any, null as any, null as any)).to.eql(true);
    });
  });

  describe('handle', () => {
    it('no success_id or fail_id', () => {
      const context = { trace: { debug: sinon.stub() } };
      expect(cancelPaymentHandler.handle({} as any, context as any, null as any, null as any)).to.eql(null);
      expect(context.trace.debug.args).to.eql([['__Cancel payment__ - entered']]);
    });

    it('success_id', () => {
      const block = { success_id: 'success-id' };
      const context = { trace: { debug: sinon.stub() } };
      expect(cancelPaymentHandler.handle(block as any, context as any, null as any, null as any)).to.eql(block.success_id);
      expect(context.trace.debug.args).to.eql([['__Cancel payment__ - entered'], ['__Cancel payment__ - redirecting to the success block']]);
    });

    it('fail_id', () => {
      const block = { fail_id: 'fail-id' };
      const context = { trace: { debug: sinon.stub() } };
      expect(cancelPaymentHandler.handle(block as any, context as any, null as any, null as any)).to.eql(block.fail_id);
      expect(context.trace.debug.args).to.eql([
        ['__Cancel payment__ - entered'],
        ['__Cancel payment__ - success link is not provided, redirecting to the fail block'],
      ]);
    });
  });
});
