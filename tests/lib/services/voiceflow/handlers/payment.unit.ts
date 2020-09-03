import { expect } from 'chai';
import sinon from 'sinon';

import { S } from '@/lib/constants';
import PaymentHandler, { PaymentResponseBuilder } from '@/lib/services/voiceflow/handlers/payment';

describe('payment handler unit tests', () => {
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
    it('works correctly', () => {
      const context = { storage: { set: sinon.stub() } };
      const node = {
        product_id: 'produc-id',
        success_id: 'success-id',
        fail_id: 'fail-id',
        id: 'node-id',
      };

      expect(paymentHandler.handle(node as any, context as any, null as any, null as any)).to.eql(node.id);
      expect(context.storage.set.args).to.eql([
        [
          S.PAYMENT,
          {
            productId: node.product_id,
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
