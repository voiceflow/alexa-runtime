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
      expect(paymentHandler.handle({ product_id: '1' } as any, context as any, null as any, null as any)).to.eql(null);
      expect(context.trace.debug.args).to.eql([['__payment__ - entered']]);
    });

    it('success_id', () => {
      const node = { product_id: '1', success_id: 'success-id' };
      const context = { trace: { debug: sinon.stub() } };
      expect(paymentHandler.handle(node as any, context as any, null as any, null as any)).to.eql(node.success_id);
      expect(context.trace.debug.args).to.eql([['__payment__ - entered'], ['__payment__ - success path triggered']]);
    });

    it('fail_id', () => {
      const node = { product_id: '1', fail_id: 'fail-id' };
      const context = { trace: { debug: sinon.stub() } };
      expect(paymentHandler.handle(node as any, context as any, null as any, null as any)).to.eql(node.fail_id);
      expect(context.trace.debug.args).to.eql([['__payment__ - entered'], ['__payment__ - success path not provided, redirecting to the fail path']]);
    });
  });
});
