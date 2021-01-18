import { expect } from 'chai';
import sinon from 'sinon';

import { updateRuntime } from '@/lib/services/alexa/utils';

describe('alexa manager utils unit tests', () => {
  describe('updateRuntime', () => {
    it('works correctly', async () => {
      const rawStateBefore = 'before';
      const rawStateAfter = 'after';

      const runtime = { getRawState: sinon.stub().returns(rawStateAfter) };
      const voiceflow = { createRuntime: sinon.stub().returns(runtime) };

      const handlerInput = {
        runtime: { versionID: 'version-id', voiceflow },
        attributesManager: { setPersistentAttributes: sinon.stub(), getPersistentAttributes: sinon.stub().returns(rawStateBefore) },
      };
      const produce = sinon.stub();

      await updateRuntime(handlerInput as any, produce as any);

      expect(voiceflow.createRuntime.args).to.eql([[handlerInput.runtime.versionID, rawStateBefore]]);
      expect(produce.args).to.eql([[runtime]]);
      expect(handlerInput.attributesManager.setPersistentAttributes.args).to.eql([[rawStateAfter]]);
    });
  });
});
