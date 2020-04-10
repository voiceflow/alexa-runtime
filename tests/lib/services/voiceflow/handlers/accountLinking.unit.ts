import { expect } from 'chai';
import sinon from 'sinon';

import { S, T } from '@/lib/constants';
import AccountLinkingHandler, { AccountLinkingResponseBuilder } from '@/lib/services/voiceflow/handlers/accountLinking';

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
      const context = { turn: { set: sinon.stub() } };
      const block = {
        nextId: 'next-id',
      };

      expect(accountLinkingHandler.handle(block as any, context as any, null as any, null as any)).to.eql(block.nextId);
      expect(context.turn.set.args).to.eql([[T.ACCOUNT_LINKING, true]]);
    });

    it('no nextId', () => {
      const context = { turn: { set: sinon.stub() } };
      const block = {};

      expect(accountLinkingHandler.handle(block as any, context as any, null as any, null as any)).to.eql(null);
      expect(context.turn.set.args).to.eql([[T.ACCOUNT_LINKING, true]]);
    });
  });

  describe('response builder', () => {
    it('no account linking', () => {
      const context = { turn: { get: sinon.stub().returns(null) } };
      AccountLinkingResponseBuilder(context as any, null as any);
      expect(context.turn.get.args).to.eql([[T.ACCOUNT_LINKING]]);
    });

    it('with account linking', () => {
      const context = { turn: { get: sinon.stub().returns(true) } };
      const builder = { withLinkAccountCard: sinon.stub() };
      AccountLinkingResponseBuilder(context as any, builder as any);
      expect(context.turn.get.args).to.eql([[T.ACCOUNT_LINKING]]);
      expect(builder.withLinkAccountCard.callCount).to.eql(1);
    });
  });
});
