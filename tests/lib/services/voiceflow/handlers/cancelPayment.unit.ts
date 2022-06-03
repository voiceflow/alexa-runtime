import { expect } from 'chai';
import sinon from 'sinon';

import { S } from '@/lib/constants';
import CancelPaymentHandler, { CancelPaymentResponseBuilder } from '@/lib/services/runtime/handlers/cancelPayment';

describe('cancel payment handler unit tests', () => {
  const cancelPaymentHandler = CancelPaymentHandler();

  describe('canHandle', () => {
    it('false', () => {
      expect(cancelPaymentHandler.canHandle({} as any, null as any, null as any, null as any)).to.eql(false);
    });

    it('true', () => {
      expect(
        cancelPaymentHandler.canHandle({ cancel_product_id: '1' } as any, null as any, null as any, null as any)
      ).to.eql(true);
    });
  });

  describe('handle', () => {
    it('works correctly', () => {
      const runtime = { storage: { set: sinon.stub() } };
      const node = {
        cancel_product_id: 'cancel-product-id',
        success_id: 'success-id',
        fail_id: 'fail-id',
        id: 'node-id',
      };

      expect(cancelPaymentHandler.handle(node as any, runtime as any, null as any, null as any)).to.eql(node.id);
      expect(runtime.storage.set.args).to.eql([
        [
          S.CANCEL_PAYMENT,
          {
            productId: node.cancel_product_id,
            successPath: node.success_id,
            failPath: node.fail_id,
            status: null,
          },
        ],
      ]);
    });
  });

  describe('response builder', () => {
    it('no payment', () => {
      const runtime = { storage: { get: sinon.stub().returns(null) } };
      CancelPaymentResponseBuilder(runtime as any, null as any);
      expect(runtime.storage.get.args).to.eql([[S.CANCEL_PAYMENT]]);
    });

    it('with status', () => {
      const runtime = { storage: { get: sinon.stub().returns({ status: 'random' }) } };
      CancelPaymentResponseBuilder(runtime as any, null as any);
      expect(runtime.storage.get.args).to.eql([[S.CANCEL_PAYMENT]]);
    });

    it('no status', () => {
      const payment = { productId: 'product-id' };
      const runtime = { storage: { get: sinon.stub().returns(payment) } };
      const withShouldEndSession = sinon.stub();
      const builder = { addDirective: sinon.stub().returns({ withShouldEndSession }) };
      CancelPaymentResponseBuilder(runtime as any, builder as any);
      expect(runtime.storage.get.args).to.eql([[S.CANCEL_PAYMENT]]);
      expect(builder.addDirective.args).to.eql([
        [
          {
            type: 'Connections.SendRequest',
            name: 'Cancel',
            payload: {
              InSkillProduct: {
                productId: payment.productId,
              },
            },
            token: 'correlatonToken',
          },
        ],
      ]);
      expect(withShouldEndSession.args).to.eql([[true]]);
    });
  });
});
