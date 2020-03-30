import { expect } from 'chai';
import sinon from 'sinon';

import { updateContext } from '@/lib/services/alexa/utils';

describe('alexa manager utils unit tests', () => {
  describe('updateContext', () => {
    it('works correctly', async () => {
      const rawStateBefore = 'before';
      const rawStateAfter = 'after';

      const context = { getRawState: sinon.stub().returns(rawStateAfter) };
      const voiceflow = { createContext: sinon.stub().returns(context) };

      const handlerInput = {
        context: { versionID: 'version-id', voiceflow },
        attributesManager: { setPersistentAttributes: sinon.stub(), getPersistentAttributes: sinon.stub().returns(rawStateBefore) },
      };
      const produce = sinon.stub();

      await updateContext(handlerInput as any, produce as any);

      expect(voiceflow.createContext.args).to.eql([[handlerInput.context.versionID, rawStateBefore]]);
      expect(produce.args).to.eql([[context]]);
      expect(handlerInput.attributesManager.setPersistentAttributes.args).to.eql([[rawStateAfter]]);
    });
  });
});
