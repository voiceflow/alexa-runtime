import { expect } from 'chai';
import sinon from 'sinon';

import { S } from '@/lib/constants';
import CancelPaymentStateHandler from '@/lib/services/runtime/handlers/state/cancelPayment';

describe('cancelPayment state handler unit tests', () => {
  const cancelPaymentStateHandler = CancelPaymentStateHandler();

  describe('canHandle', () => {
    it('false', () => {
      const runtime = { storage: { get: sinon.stub().returns(null) } };
      const result = cancelPaymentStateHandler.canHandle(null as any, runtime as any, null as any, null as any);
      expect(result).to.eql(false);
      expect(runtime.storage.get.args).to.eql([[S.CANCEL_PAYMENT]]);
    });

    it('true', () => {
      const runtime = { storage: { get: sinon.stub().returns({ foo: 'bar' }) } };
      const result = cancelPaymentStateHandler.canHandle(null as any, runtime as any, null as any, null as any);
      expect(result).to.eql(true);
      expect(runtime.storage.get.args).to.eql([[S.CANCEL_PAYMENT]]);
    });
  });

  describe('handle', () => {
    it('success path', () => {
      const cancelPayment = { status: 'ACCEPTED', successPath: 'success-path-id', failPath: 'fail-path-id' };
      const runtime = { storage: { get: sinon.stub().returns(cancelPayment), delete: sinon.stub() } };

      const result = cancelPaymentStateHandler.handle(null as any, runtime as any, null as any, null as any);
      expect(result).to.eql(cancelPayment.successPath);
      expect(runtime.storage.get.args).to.eql([[S.CANCEL_PAYMENT]]);
      expect(runtime.storage.delete.args).to.eql([[S.CANCEL_PAYMENT]]);
    });

    it('fail path', () => {
      const cancelPayment = { status: 'failed status', successPath: 'success-path-id', failPath: 'fail-path-id' };
      const runtime = { storage: { get: sinon.stub().returns(cancelPayment), delete: sinon.stub() } };

      const result = cancelPaymentStateHandler.handle(null as any, runtime as any, null as any, null as any);
      expect(result).to.eql(cancelPayment.failPath);
      expect(runtime.storage.get.args).to.eql([[S.CANCEL_PAYMENT]]);
      expect(runtime.storage.delete.args).to.eql([[S.CANCEL_PAYMENT]]);
    });
  });
});
