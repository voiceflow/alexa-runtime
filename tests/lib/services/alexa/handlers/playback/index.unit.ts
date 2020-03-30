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
    describe('media handler can handle', () => {
      const generateUtils = () => {
        const output = 'output';
        const mediaHandler1 = { canHandle: sinon.stub().returns(false), handle: sinon.stub().returns('random0') };
        const mediaHandler2 = { canHandle: sinon.stub().returns(true), handle: sinon.stub().returns(output) };
        const mediaHandler3 = { canHandle: sinon.stub().returns(false), handle: sinon.stub().returns('random2') };

        const context = 'context';
        const utils = {
          MediaHandlers: [mediaHandler1, mediaHandler2, mediaHandler3],
          buildContext: sinon.stub().returns(context),
        };

        return { utils, output, context };
      };

      it('Command.NEXT', async () => {
        const { utils, output, context } = generateUtils();
        const handler = PlaybackControllerHandlerGenerator(utils as any);

        const input = { requestEnvelope: { request: { type: `PlaybackController.${Command.NEXT}` } }, context: { context: null } };
        expect(await handler.handle(input as any)).to.eql(output);
        expect(utils.MediaHandlers[1].handle.args[0][0].context.context).to.eql(context);
        expect(utils.MediaHandlers[1].handle.args[0][0].requestEnvelope.request.intent).to.eql({ name: IntentName.NEXT, confirmationStatus: 'NONE' });
      });

      it('Command.PREV', async () => {
        const { utils, output, context } = generateUtils();
        const handler = PlaybackControllerHandlerGenerator(utils as any);

        const input = { requestEnvelope: { request: { type: `PlaybackController.${Command.PREV}` } }, context: { context: null } };
        expect(await handler.handle(input as any)).to.eql(output);
        expect(utils.MediaHandlers[1].handle.args[0][0].context.context).to.eql(context);
        expect(utils.MediaHandlers[1].handle.args[0][0].requestEnvelope.request.intent).to.eql({ name: IntentName.PREV, confirmationStatus: 'NONE' });
      });

      it('Command.PLAY', async () => {
        const { utils, output, context } = generateUtils();
        const handler = PlaybackControllerHandlerGenerator(utils as any);

        const input = { requestEnvelope: { request: { type: `PlaybackController.${Command.PLAY}` } }, context: { context: null } };
        expect(await handler.handle(input as any)).to.eql(output);
        expect(utils.MediaHandlers[1].handle.args[0][0].context.context).to.eql(context);
        expect(utils.MediaHandlers[1].handle.args[0][0].requestEnvelope.request.intent).to.eql({
          name: IntentName.RESUME,
          confirmationStatus: 'NONE',
        });
      });

      it('Command.PAUSE', async () => {
        const { utils, output, context } = generateUtils();
        const handler = PlaybackControllerHandlerGenerator(utils as any);

        const input = { requestEnvelope: { request: { type: `PlaybackController.${Command.PAUSE}` } }, context: { context: null } };
        expect(await handler.handle(input as any)).to.eql(output);
        expect(utils.MediaHandlers[1].handle.args[0][0].context.context).to.eql(context);
        expect(utils.MediaHandlers[1].handle.args[0][0].requestEnvelope.request.intent).to.eql({
          name: IntentName.PAUSE,
          confirmationStatus: 'NONE',
        });
      });

      it('other intent', async () => {
        const { utils, output, context } = generateUtils();
        const handler = PlaybackControllerHandlerGenerator(utils as any);

        const input = { requestEnvelope: { request: { type: 'PlaybackController.random' } }, context: { context: null } };
        expect(await handler.handle(input as any)).to.eql(output);
        expect(utils.MediaHandlers[1].handle.args[0][0].context.context).to.eql(context);
        expect(utils.MediaHandlers[1].handle.args[0][0].requestEnvelope.request.intent).to.eql({
          name: IntentName.FALLBACK,
          confirmationStatus: 'NONE',
        });
      });
    });

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
      expect(utils.IntentHandler.handle.args[0][0].context.context).to.eql(context);
      expect(utils.IntentHandler.handle.args[0][0].requestEnvelope.request.intent).to.eql({ name: IntentName.NEXT, confirmationStatus: 'NONE' });
    });
  });
});
