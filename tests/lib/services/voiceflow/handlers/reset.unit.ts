import { expect } from 'chai';
import sinon from 'sinon';

import ResetHandler from '@/lib/services/voiceflow/handlers/reset';

describe('reset handler unit tests', async () => {
  const resetHandler = ResetHandler();

  afterEach(() => sinon.restore());

  describe('canHandle', () => {
    it('false', async () => {
      const node = {};

      const result = resetHandler.canHandle(node as any, null as any, null as any, null as any);

      expect(result).to.eql(false);
    });

    it('true', async () => {
      const node = { reset: { foo: 'bar' } };

      const result = resetHandler.canHandle(node as any, null as any, null as any, null as any);

      expect(result).to.eql(true);
    });
  });

  describe('handle', () => {
    it('works', async () => {
      const topFrame = {
        setNodeID: sinon.stub(),
      };

      const context = {
        stack: {
          popTo: sinon.stub(),
          top: sinon.stub().returns(topFrame),
        },
      };

      expect(resetHandler.handle(null as any, context as any, null as any, null as any)).to.eql(null);
      expect(context.stack.popTo.args).to.eql([[1]]);
      expect(topFrame.setNodeID.args).to.eql([[null]]);
    });
  });
});
