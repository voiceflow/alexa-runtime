import { expect } from 'chai';
import sinon from 'sinon';

import { S, T } from '@/lib/constants';
import AccountLinkingHandler, { AccountLinkingResponseBuilder } from '@/lib/services/runtime/handlers/accountLinking';

describe('permission card handler unit tests', () => {
  const accountLinkingHandler = AccountLinkingHandler();

  describe('canHandle', () => {
    it('false', () => {
      expect(accountLinkingHandler.canHandle({} as any, null as any, null as any, null as any)).to.eql(false);
    });

    it('true', () => {
      expect(accountLinkingHandler.canHandle({ link_account: true } as any, null as any, null as any, null as any)).to.eql(true);
    });
  });

  describe('handle', () => {
    it('works correctly', () => {
      const runtime = { turn: { set: sinon.stub() } };
      const node = {
        nextId: 'next-id',
      };

      expect(accountLinkingHandler.handle(node as any, runtime as any, null as any, null as any)).to.eql(node.nextId);
      expect(runtime.turn.set.args).to.eql([[T.ACCOUNT_LINKING, true]]);
    });

    it('no nextId', () => {
      const runtime = { turn: { set: sinon.stub() } };
      const node = {};

      expect(accountLinkingHandler.handle(node as any, runtime as any, null as any, null as any)).to.eql(null);
      expect(runtime.turn.set.args).to.eql([[T.ACCOUNT_LINKING, true]]);
    });
  });

  describe('response builder', () => {
    it('no account linking', () => {
      const runtime = { turn: { get: sinon.stub().returns(null) } };
      AccountLinkingResponseBuilder(runtime as any, null as any);
      expect(runtime.turn.get.args).to.eql([[T.ACCOUNT_LINKING]]);
    });

    it('with account linking', () => {
      const runtime = { turn: { get: sinon.stub().returns(true) } };
      const builder = { withLinkAccountCard: sinon.stub() };
      AccountLinkingResponseBuilder(runtime as any, builder as any);
      expect(runtime.turn.get.args).to.eql([[T.ACCOUNT_LINKING]]);
      expect(builder.withLinkAccountCard.callCount).to.eql(1);
    });
  });
});
