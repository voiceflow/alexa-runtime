import { expect } from 'chai';
import sinon from 'sinon';

import DisplayHandler from '@/lib/services/test/handlers/display';

describe('Test displayHandler unit tests', () => {
  const displayHandler = DisplayHandler();

  describe('canHandle', () => {
    it('false', () => {
      expect(displayHandler.canHandle({} as any, null as any, null as any, null as any)).to.eql(false);
    });

    it('true', () => {
      expect(displayHandler.canHandle({ display_id: '1' } as any, null as any, null as any, null as any)).to.eql(true);
    });
  });

  describe('handle', () => {
    it('no nextId', () => {
      const runtime = { trace: { debug: sinon.stub() } };
      expect(displayHandler.handle({} as any, runtime as any, null as any, null as any)).to.eql(null);
      expect(runtime.trace.debug.args).to.eql([['__display__ - entered']]);
    });

    it('nextId', () => {
      const node = { nextId: 'next-id' };
      const runtime = { trace: { debug: sinon.stub() } };
      expect(displayHandler.handle(node as any, runtime as any, null as any, null as any)).to.eql(node.nextId);
      expect(runtime.trace.debug.args).to.eql([['__display__ - entered'], ['__display__ - redirecting to the next step']]);
    });
  });
});
