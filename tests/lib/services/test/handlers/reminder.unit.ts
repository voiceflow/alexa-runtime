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
      const context = { trace: { debug: sinon.stub() } };
      expect(reminderHandler.handle({} as any, context as any, null as any, null as any)).to.eql(null);
      expect(context.trace.debug.args).to.eql([['__reminder__ - entered']]);
    });

    it('success_id', () => {
      const block = { success_id: 'success-id' };
      const context = { trace: { debug: sinon.stub() } };
      expect(reminderHandler.handle(block as any, context as any, null as any, null as any)).to.eql(block.success_id);
      expect(context.trace.debug.args).to.eql([['__reminder__ - entered'], ['__reminder__ - success path triggered']]);
    });

    it('fail_id', () => {
      const block = { fail_id: 'fail-id' };
      const context = { trace: { debug: sinon.stub() } };
      expect(reminderHandler.handle(block as any, context as any, null as any, null as any)).to.eql(block.fail_id);
      expect(context.trace.debug.args).to.eql([
        ['__reminder__ - entered'],
        ['__reminder__ - success link is not provided, redirecting to the fail block'],
      ]);
    });
  });
});
