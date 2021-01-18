import { expect } from 'chai';
import sinon from 'sinon';

import ReminderHandler from '@/lib/services/test/handlers/reminder';

describe('Test reminderHandler unit tests', () => {
  const reminderHandler = ReminderHandler();

  describe('canHandle', () => {
    it('false', () => {
      expect(reminderHandler.canHandle({} as any, null as any, null as any, null as any)).to.eql(false);
    });

    it('true', () => {
      expect(reminderHandler.canHandle({ reminder: {} } as any, null as any, null as any, null as any)).to.eql(true);
    });
  });

  describe('handle', () => {
    it('no success_id or fail_id', () => {
      const runtime = { trace: { debug: sinon.stub() } };
      expect(reminderHandler.handle({} as any, runtime as any, null as any, null as any)).to.eql(null);
      expect(runtime.trace.debug.args).to.eql([['__reminder__ - entered']]);
    });

    it('success_id', () => {
      const node = { success_id: 'success-id' };
      const runtime = { trace: { debug: sinon.stub() } };
      expect(reminderHandler.handle(node as any, runtime as any, null as any, null as any)).to.eql(node.success_id);
      expect(runtime.trace.debug.args).to.eql([['__reminder__ - entered'], ['__reminder__ - success path triggered']]);
    });

    it('fail_id', () => {
      const node = { fail_id: 'fail-id' };
      const runtime = { trace: { debug: sinon.stub() } };
      expect(reminderHandler.handle(node as any, runtime as any, null as any, null as any)).to.eql(node.fail_id);
      expect(runtime.trace.debug.args).to.eql([
        ['__reminder__ - entered'],
        ['__reminder__ - success path not provided, redirecting to the fail path'],
      ]);
    });
  });
});
