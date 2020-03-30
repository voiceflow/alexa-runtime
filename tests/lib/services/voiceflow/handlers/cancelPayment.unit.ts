import { expect } from 'chai';
import sinon from 'sinon';

import { S } from '@/lib/constants';
import CancelPaymentHandler, { CancelPaymentResponseBuilder } from '@/lib/services/voiceflow/handlers/cancelPayment';

describe('cancel payment handler unit tests', () => {
  describe('canHandle', () => {
    it('false', () => {
      expect(CancelPaymentHandler.canHandle({} as any, null as any, null as any, null as any)).to.eql(false);
    });

    it('true', () => {
      expect(CancelPaymentHandler.canHandle({ cancel_product_id: '1' } as any, null as any, null as any, null as any)).to.eql(true);
    });
  });

  describe('handle', () => {
    it('works correctly', () => {
      const context = { storage: { set: sinon.stub() } };
      const block = {
        cancel_product_id: 'cancel-product-id',
        success_id: 'success-id',
        fail_id: 'fail-id',
        blockID: 'block-id',
      };

      expect(CancelPaymentHandler.handle(block, context as any, null as any, null as any)).to.eql(block.blockID);
      expect(context.storage.set.args).to.eql([
        [
          S.CANCEL_PAYMENT,
          {
            productId: block.cancel_product_id,
            successPath: block.success_id,
            failPath: block.fail_id,
            status: null,
          },
        ],
      ]);
    });
  });

  describe('response builder', () => {
    it('no payment', () => {
      const context = { storage: { get: sinon.stub().returns(null) } };
      CancelPaymentResponseBuilder(context as any, null as any);
      expect(context.storage.get.args).to.eql([[S.CANCEL_PAYMENT]]);
    });

    it('with status', () => {
      const context = { storage: { get: sinon.stub().returns({ status: 'random' }) } };
      CancelPaymentResponseBuilder(context as any, null as any);
      expect(context.storage.get.args).to.eql([[S.CANCEL_PAYMENT]]);
    });

    it('no status', () => {
      const payment = { productId: 'product-id' };
      const context = { storage: { get: sinon.stub().returns(payment) } };
      const withShouldEndSession = sinon.stub();
      const builder = { addDirective: sinon.stub().returns({ withShouldEndSession }) };
      CancelPaymentResponseBuilder(context as any, builder as any);
      expect(context.storage.get.args).to.eql([[S.CANCEL_PAYMENT]]);
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
