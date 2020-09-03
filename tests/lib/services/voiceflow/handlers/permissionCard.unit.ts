import { expect } from 'chai';
import sinon from 'sinon';

import { S, T } from '@/lib/constants';
import PermissionCardHandler, { PermissionCardResponseBuilder } from '@/lib/services/voiceflow/handlers/permissionCard';

describe('permission card handler unit tests', () => {
  const permissionCardHandler = PermissionCardHandler();

  describe('canHandle', () => {
    it('false', () => {
      expect(permissionCardHandler.canHandle({} as any, null as any, null as any, null as any)).to.eql(false);
    });

    it('true', () => {
      expect(permissionCardHandler.canHandle({ permission_card: {} } as any, null as any, null as any, null as any)).to.eql(true);
    });
  });

  describe('handle', () => {
    it('works correctly', () => {
      const context = { turn: { set: sinon.stub() }, trace: { debug: sinon.stub() } };
      const node = {
        nextId: 'next-id',
        permission_card: 'permission-card',
      };

      expect(permissionCardHandler.handle(node as any, context as any, null as any, null as any)).to.eql(node.nextId);
      expect(context.turn.set.args).to.eql([[T.PERMISSION_CARD, node.permission_card]]);
    });

    it('no nextId', () => {
      const context = { turn: { set: sinon.stub() }, trace: { debug: sinon.stub() } };
      const node = {
        permission_card: 'permission-card',
      };

      expect(permissionCardHandler.handle(node as any, context as any, null as any, null as any)).to.eql(null);
      expect(context.turn.set.args).to.eql([[T.PERMISSION_CARD, node.permission_card]]);
    });
  });

  describe('response builder', () => {
    it('no permission card', () => {
      const context = { turn: { get: sinon.stub().returns(null) } };
      PermissionCardResponseBuilder(context as any, null as any);
      expect(context.turn.get.args).to.eql([[T.PERMISSION_CARD]]);
    });

    describe('with permission card', () => {
      describe('is array', () => {
        it('empty', () => {
          const context = { turn: { get: sinon.stub().returns([]) } };
          PermissionCardResponseBuilder(context as any, null as any);
          expect(context.turn.get.args).to.eql([[T.PERMISSION_CARD]]);
        });

        it('full', () => {
          const permissions = ['a', 'b'];
          const context = { turn: { get: sinon.stub().returns(permissions) } };
          const builder = { withAskForPermissionsConsentCard: sinon.stub() };
          PermissionCardResponseBuilder(context as any, builder as any);
          expect(context.turn.get.args).to.eql([[T.PERMISSION_CARD]]);
          expect(builder.withAskForPermissionsConsentCard.args).to.eql([[permissions]]);
        });
      });

      describe('not array', () => {
        it('storage key null', () => {
          const context = { turn: { get: sinon.stub().returns('string') }, storage: { get: sinon.stub().returns(null) } };
          PermissionCardResponseBuilder(context as any, null as any);
          expect(context.turn.get.args).to.eql([[T.PERMISSION_CARD]]);
          expect(context.storage.get.args).to.eql([[S.ALEXA_PERMISSIONS]]);
        });
      });
    });
  });
});
