import { expect } from 'chai';
import sinon from 'sinon';

import DisplayHandler from '@/lib/services/test/handlers/display';

describe('Test DisplayHandler unit tests', () => {
  describe('canHandle', () => {
    it('false', () => {
      expect(DisplayHandler.canHandle({} as any, null as any, null as any, null as any)).to.eql(false);
    });

    it('true', () => {
      expect(DisplayHandler.canHandle({ display_id: '1' } as any, null as any, null as any, null as any)).to.eql(true);
    });
  });

  describe('handle', () => {
    it('no nextId', () => {
      const context = { trace: { debug: sinon.stub() } };
      expect(DisplayHandler.handle({} as any, context as any, null as any, null as any)).to.eql(null);
      expect(context.trace.debug.args).to.eql([['__Display__ - entered']]);
    });

    it('nextId', () => {
      const block = { nextId: 'next-id' };
      const context = { trace: { debug: sinon.stub() } };
      expect(DisplayHandler.handle(block as any, context as any, null as any, null as any)).to.eql(block.nextId);
      expect(context.trace.debug.args).to.eql([['__Display__ - entered'], ['__Display__ - redirecting to the next block']]);
    });
  });
});
