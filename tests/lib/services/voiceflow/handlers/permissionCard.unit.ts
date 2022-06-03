import { expect } from 'chai';
import sinon from 'sinon';

import { S, T } from '@/lib/constants';
import PermissionCardHandler, { PermissionCardResponseBuilder } from '@/lib/services/runtime/handlers/permissionCard';

describe('permission card handler unit tests', () => {
  const permissionCardHandler = PermissionCardHandler();

  describe('canHandle', () => {
    it('false', () => {
      expect(permissionCardHandler.canHandle({} as any, null as any, null as any, null as any)).to.eql(false);
    });

    it('true', () => {
      expect(
        permissionCardHandler.canHandle({ permission_card: {} } as any, null as any, null as any, null as any)
      ).to.eql(true);
    });
  });

  describe('handle', () => {
    it('works correctly', () => {
      const runtime = { turn: { set: sinon.stub() }, trace: { debug: sinon.stub() } };
      const node = {
        nextId: 'next-id',
        permission_card: 'permission-card',
      };

      expect(permissionCardHandler.handle(node as any, runtime as any, null as any, null as any)).to.eql(node.nextId);
      expect(runtime.turn.set.args).to.eql([[T.PERMISSION_CARD, node.permission_card]]);
    });

    it('no nextId', () => {
      const runtime = { turn: { set: sinon.stub() }, trace: { debug: sinon.stub() } };
      const node = {
        permission_card: 'permission-card',
      };

      expect(permissionCardHandler.handle(node as any, runtime as any, null as any, null as any)).to.eql(null);
      expect(runtime.turn.set.args).to.eql([[T.PERMISSION_CARD, node.permission_card]]);
    });
  });

  describe('response builder', () => {
    it('no permission card', () => {
      const runtime = { turn: { get: sinon.stub().returns(null) } };
      PermissionCardResponseBuilder(runtime as any, null as any);
      expect(runtime.turn.get.args).to.eql([[T.PERMISSION_CARD]]);
    });

    describe('with permission card', () => {
      describe('is array', () => {
        it('empty', () => {
          const runtime = { turn: { get: sinon.stub().returns([]) } };
          PermissionCardResponseBuilder(runtime as any, null as any);
          expect(runtime.turn.get.args).to.eql([[T.PERMISSION_CARD]]);
        });

        it('full', () => {
          const permissions = ['a', 'b'];
          const runtime = { turn: { get: sinon.stub().returns(permissions) } };
          const builder = { withAskForPermissionsConsentCard: sinon.stub() };
          PermissionCardResponseBuilder(runtime as any, builder as any);
          expect(runtime.turn.get.args).to.eql([[T.PERMISSION_CARD]]);
          expect(builder.withAskForPermissionsConsentCard.args).to.eql([[permissions]]);
        });
      });

      describe('not array', () => {
        it('storage key null', () => {
          const runtime = {
            turn: { get: sinon.stub().returns('string') },
            storage: { get: sinon.stub().returns(null) },
          };
          PermissionCardResponseBuilder(runtime as any, null as any);
          expect(runtime.turn.get.args).to.eql([[T.PERMISSION_CARD]]);
          expect(runtime.storage.get.args).to.eql([[S.ALEXA_PERMISSIONS]]);
        });
      });
    });
  });
});
