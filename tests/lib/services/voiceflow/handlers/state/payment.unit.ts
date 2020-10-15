import { expect } from 'chai';
import sinon from 'sinon';

import { S } from '@/lib/constants';
import PaymentStateHandler from '@/lib/services/voiceflow/handlers/state/payment';

describe('payment state handler unit tests', () => {
  const paymentStateHandler = PaymentStateHandler();

  describe('canHandle', () => {
    it('false', () => {
      const context = { storage: { get: sinon.stub().returns(null) } };
      const result = paymentStateHandler.canHandle(null as any, context as any, null as any, null as any);
      expect(result).to.eql(false);
      expect(context.storage.get.args).to.eql([[S.PAYMENT]]);
    });

    it('true', () => {
      const context = { storage: { get: sinon.stub().returns({ foo: 'bar' }) } };
      const result = paymentStateHandler.canHandle(null as any, context as any, null as any, null as any);
      expect(result).to.eql(true);
      expect(context.storage.get.args).to.eql([[S.PAYMENT]]);
    });
  });

  describe('handle', () => {
    describe('success path', () => {
      it('ACCEPTED', () => {
        const payment = { status: 'ACCEPTED', successPath: 'success-path-id', failPath: 'fail-path-id' };
        const context = { storage: { get: sinon.stub().returns(payment), delete: sinon.stub() } };

        const result = paymentStateHandler.handle(null as any, context as any, null as any, null as any);
        expect(result).to.eql(payment.successPath);
        expect(context.storage.get.args).to.eql([[S.PAYMENT]]);
        expect(context.storage.delete.args).to.eql([[S.PAYMENT]]);
      });

      it('PURCHASED', () => {
        const payment = { status: 'ALREADY_PURCHASED', successPath: 'success-path-id', failPath: 'fail-path-id' };
        const context = { storage: { get: sinon.stub().returns(payment), delete: sinon.stub() } };

        const result = paymentStateHandler.handle(null as any, context as any, null as any, null as any);
        expect(result).to.eql(payment.successPath);
        expect(context.storage.get.args).to.eql([[S.PAYMENT]]);
        expect(context.storage.delete.args).to.eql([[S.PAYMENT]]);
      });

      it('PENDING', () => {
        const payment = { status: 'PENDING_PURCHASE', successPath: 'success-path-id', failPath: 'fail-path-id' };
        const context = { storage: { get: sinon.stub().returns(payment), delete: sinon.stub() } };

        const result = paymentStateHandler.handle(null as any, context as any, null as any, null as any);
        expect(result).to.eql(payment.successPath);
        expect(context.storage.get.args).to.eql([[S.PAYMENT]]);
        expect(context.storage.delete.args).to.eql([[S.PAYMENT]]);
      });
    });

    it('fail path', () => {
      const payment = { status: 'failed status', successPath: 'success-path-id', failPath: 'fail-path-id' };
      const context = { storage: { get: sinon.stub().returns(payment), delete: sinon.stub() } };

      const result = paymentStateHandler.handle(null as any, context as any, null as any, null as any);
      expect(result).to.eql(payment.failPath);
      expect(context.storage.get.args).to.eql([[S.PAYMENT]]);
      expect(context.storage.delete.args).to.eql([[S.PAYMENT]]);
    });
  });
});
