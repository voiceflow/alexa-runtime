import { expect } from 'chai';
import sinon from 'sinon';

import { updateRuntime } from '@/lib/services/alexa/utils';

describe('alexa manager utils unit tests', () => {
  describe('updateRuntime', () => {
    it('works correctly', async () => {
      const rawStateBefore = 'before';
      const rawStateAfter = 'after';

      const runtime = { getRawState: sinon.stub().returns(rawStateAfter) };
      const runtimeClient = { createRuntime: sinon.stub().returns(runtime) };

      const handlerInput = {
        context: { versionID: 'version-id', runtimeClient },
        attributesManager: {
          setPersistentAttributes: sinon.stub(),
          getPersistentAttributes: sinon.stub().returns(rawStateBefore),
        },
      };
      const produce = sinon.stub();

      await updateRuntime(handlerInput as any, produce as any);

      expect(runtimeClient.createRuntime.args).to.eql([
        [{ versionID: handlerInput.context.versionID, state: rawStateBefore }],
      ]);
      expect(produce.args).to.eql([[runtime]]);
      expect(handlerInput.attributesManager.setPersistentAttributes.args).to.eql([[rawStateAfter]]);
    });
  });
});
