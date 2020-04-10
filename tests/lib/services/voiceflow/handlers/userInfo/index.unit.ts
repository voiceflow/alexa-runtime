import { expect } from 'chai';
import sinon from 'sinon';

import { UserInfoHandler } from '@/lib/services/voiceflow/handlers/userInfo';

describe('user info handler unit test', () => {
  describe('canHandle', () => {
    it('false', () => {
      expect(UserInfoHandler(null as any).canHandle({} as any, null as any, null as any, null as any)).to.eql(false);
    });

    it('true', () => {
      expect(UserInfoHandler(null as any).canHandle({ permissions: {} } as any, null as any, null as any, null as any)).to.eql(true);
    });
  });

  describe('handle', () => {
    describe('no permissions in array', () => {
      it('with success_id', async () => {
        const block = { success_id: 'success-id', permissions: [] };
        expect(await UserInfoHandler(null as any).handle(block as any, null as any, null as any, null as any)).to.eql(block.success_id);
      });

      it('without success_id', async () => {
        const block = { permissions: [] };
        expect(await UserInfoHandler(null as any).handle(block as any, null as any, null as any, null as any)).to.eql(null);
      });
    });

    describe('permissions in array', () => {
      describe('has all permissions', () => {
        it('with success id', async () => {
          const utils = { isPermissionGranted: sinon.stub().resolves(true) };
          const handler = UserInfoHandler(utils);

          const block = { permissions: ['permission1', 'permission2', 'permission3'], success_id: 'success-id' };
          const context = 'context';
          const variables = 'variables';

          expect(await handler.handle(block as any, context as any, variables as any, null as any)).to.eql(block.success_id);
          expect(utils.isPermissionGranted.args).to.eql([
            [block.permissions[0], context, variables],
            [block.permissions[1], context, variables],
            [block.permissions[2], context, variables],
          ]);
        });

        it('without success id', async () => {
          const utils = { isPermissionGranted: sinon.stub().resolves(true) };
          const handler = UserInfoHandler(utils);

          const block = { permissions: ['permission1', 'permission2', 'permission3'] };

          expect(await handler.handle(block as any, null as any, null as any, null as any)).to.eql(null);
        });
      });

      describe('does not have all permissions', () => {
        it('with fail id', async () => {
          const isPermissionGranted = sinon.stub().resolves(true);
          isPermissionGranted.onSecondCall().returns(false);

          const utils = { isPermissionGranted };
          const handler = UserInfoHandler(utils);

          const block = { permissions: ['permission1', 'permission2', 'permission3'], fail_id: 'fail-id' };

          expect(await handler.handle(block as any, null as any, null as any, null as any)).to.eql(block.fail_id);
        });

        it('without fail id', async () => {
          const isPermissionGranted = sinon.stub().resolves(true);
          isPermissionGranted.onSecondCall().returns(false);

          const utils = { isPermissionGranted };
          const handler = UserInfoHandler(utils);

          const block = { permissions: ['permission1', 'permission2', 'permission3'] };

          expect(await handler.handle(block as any, null as any, null as any, null as any)).to.eql(null);
        });
      });
    });
  });
});
