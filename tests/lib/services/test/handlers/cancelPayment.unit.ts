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
      const runtime = { trace: { debug: sinon.stub() } };
      expect(cancelPaymentHandler.handle({ cancel_product_id: '1' } as any, runtime as any, null as any, null as any)).to.eql(null);
      expect(runtime.trace.debug.args).to.eql([['__cancel payment__ - entered']]);
    });

    it('success_id', () => {
      const node = { cancel_product_id: '1', success_id: 'success-id' };
      const runtime = { trace: { debug: sinon.stub() } };
      expect(cancelPaymentHandler.handle(node as any, runtime as any, null as any, null as any)).to.eql(node.success_id);
      expect(runtime.trace.debug.args).to.eql([['__cancel payment__ - entered'], ['__cancel payment__ - success path triggered']]);
    });

    it('fail_id', () => {
      const node = { cancel_product_id: '1', fail_id: 'fail-id' };
      const runtime = { trace: { debug: sinon.stub() } };
      expect(cancelPaymentHandler.handle(node as any, runtime as any, null as any, null as any)).to.eql(node.fail_id);
      expect(runtime.trace.debug.args).to.eql([
        ['__cancel payment__ - entered'],
        ['__cancel payment__ - success path not provided, redirecting to the fail path'],
      ]);
    });
  });
});
