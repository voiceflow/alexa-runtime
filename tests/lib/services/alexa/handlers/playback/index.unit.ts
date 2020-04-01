import { expect } from 'chai';
import sinon from 'sinon';

import PlaybackControllerHandler, { PlaybackControllerHandlerGenerator } from '@/lib/services/alexa/handlers/playback';
import { Command } from '@/lib/services/alexa/handlers/playback/types';
import { IntentName } from '@/lib/services/voiceflow/types';

describe('playback controller handler unit tests', () => {
  describe('canHandle', () => {
    it('false', () => {
      expect(PlaybackControllerHandler.canHandle({ requestEnvelope: { request: { type: 'random' } } } as any)).to.eql(false);
    });

    it('true', () => {
      expect(PlaybackControllerHandler.canHandle({ requestEnvelope: { request: { type: 'PlaybackController.SMTH' } } } as any)).to.eql(true);
    });
  });

  describe('handle', () => {
    it('intent handler handles', async () => {
      const output = 'output';
      const mediaHandler = { canHandle: sinon.stub().returns(false) };

      const context = 'context';
      const utils = {
        MediaHandlers: [mediaHandler],
        buildContext: sinon.stub().returns(context),
        IntentHandler: { handle: sinon.stub().returns(output) },
      };

      const handler = PlaybackControllerHandlerGenerator(utils as any);

      const input = { requestEnvelope: { request: { type: `PlaybackController.${Command.NEXT}` } }, context: { context: null } };
      expect(await handler.handle(input as any)).to.eql(output);
      expect(utils.IntentHandler.handle.args[0][0].requestEnvelope.request.intent).to.eql({ name: IntentName.NEXT, confirmationStatus: 'NONE' });
    });
  });
});
