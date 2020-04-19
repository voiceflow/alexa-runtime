import { expect } from 'chai';
import sinon from 'sinon';

import UserInfoHandler from '@/lib/services/test/handlers/userInfo';

describe('Test userInfoHandler unit tests', () => {
  const userInfoHandler = UserInfoHandler();

  describe('canHandle', () => {
    it('false', () => {
      expect(userInfoHandler.canHandle({} as any, null as any, null as any, null as any)).to.eql(false);
    });

    it('true', () => {
      expect(userInfoHandler.canHandle({ permissions: {} } as any, null as any, null as any, null as any)).to.eql(true);
    });
  });

  describe('handle', () => {
    it('no success_id or fail_id', () => {
      const context = { trace: { debug: sinon.stub() } };
      expect(userInfoHandler.handle({} as any, context as any, null as any, null as any)).to.eql(null);
      expect(context.trace.debug.args).to.eql([['__user info__ - entered']]);
    });

    it('success_id', () => {
      const block = { success_id: 'success-id' };
      const context = { trace: { debug: sinon.stub() } };
      expect(userInfoHandler.handle(block as any, context as any, null as any, null as any)).to.eql(block.success_id);
      expect(context.trace.debug.args).to.eql([['__user info__ - entered'], ['__user info__ - success path triggered']]);
    });

    it('fail_id', () => {
      const block = { fail_id: 'fail-id' };
      const context = { trace: { debug: sinon.stub() } };
      expect(userInfoHandler.handle(block as any, context as any, null as any, null as any)).to.eql(block.fail_id);
      expect(context.trace.debug.args).to.eql([
        ['__user info__ - entered'],
        ['__user info__ - success path not provided, redirecting to the fail path'],
      ]);
    });
  });
});
