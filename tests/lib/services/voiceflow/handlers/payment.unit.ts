import { expect } from 'chai';
import sinon from 'sinon';

import { S } from '@/lib/constants';
import PaymentHandler, { PaymentResponseBuilder } from '@/lib/services/voiceflow/handlers/payment';

describe('payment handler unit tests', () => {
  describe('canHandle', () => {
    it('false', () => {
      expect(PaymentHandler.canHandle({} as any, null as any, null as any, null as any)).to.eql(false);
    });

    it('true', () => {
      expect(PaymentHandler.canHandle({ product_id: '1' } as any, null as any, null as any, null as any)).to.eql(true);
    });
  });

  describe('handle', () => {
    it('works correctly', () => {
      const context = { storage: { set: sinon.stub() } };
      const block = {
        product_id: 'produc-id',
        success_id: 'success-id',
        fail_id: 'fail-id',
        blockID: 'block-id',
      };

      expect(PaymentHandler.handle(block, context as any, null as any, null as any)).to.eql(block.blockID);
      expect(context.storage.set.args).to.eql([
        [
          S.PAYMENT,
          {
            productId: block.product_id,
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
      PaymentResponseBuilder(context as any, null as any);
      expect(context.storage.get.args).to.eql([[S.PAYMENT]]);
    });

    it('with status', () => {
      const context = { storage: { get: sinon.stub().returns({ status: 'random' }) } };
      PaymentResponseBuilder(context as any, null as any);
      expect(context.storage.get.args).to.eql([[S.PAYMENT]]);
    });

    it('no status', () => {
      const payment = { productId: 'product-id' };
      const context = { storage: { get: sinon.stub().returns(payment) } };
      const withShouldEndSession = sinon.stub();
      const builder = { addDirective: sinon.stub().returns({ withShouldEndSession }) };
      PaymentResponseBuilder(context as any, builder as any);
      expect(context.storage.get.args).to.eql([[S.PAYMENT]]);
      expect(builder.addDirective.args).to.eql([
        [
          {
            type: 'Connections.SendRequest',
            name: 'Buy',
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
