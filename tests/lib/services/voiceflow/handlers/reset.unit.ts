import { expect } from 'chai';
import sinon from 'sinon';

import ResetHandler from '@/lib/services/voiceflow/handlers/reset';

describe('reset handler unit tests', async () => {
  afterEach(() => sinon.restore());

  describe('canHandle', () => {
    it('false', async () => {
      const block = {};

      const result = ResetHandler.canHandle(block as any, null as any, null as any, null as any);

      expect(result).to.eql(false);
    });

    it('true', async () => {
      const block = { reset: { foo: 'bar' } };

      const result = ResetHandler.canHandle(block as any, null as any, null as any, null as any);

      expect(result).to.eql(true);
    });
  });

  describe('handle', () => {
    it('works', async () => {
      const topFrame = {
        setBlockID: sinon.stub(),
      };

      const context = {
        stack: {
          popTo: sinon.stub(),
          top: sinon.stub().returns(topFrame),
        },
      };

      expect(ResetHandler.handle(null as any, context as any, null as any, null as any)).to.eql(null);
      expect(context.stack.popTo.args).to.eql([[1]]);
      expect(topFrame.setBlockID.args).to.eql([[null]]);
    });
  });
});
