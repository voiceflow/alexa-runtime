import { expect } from 'chai';
import sinon from 'sinon';

import PlaybackControllerHandler, { PlaybackControllerHandlerGenerator } from '@/lib/services/alexa/request/playback';
import { Command } from '@/lib/services/alexa/request/playback/types';
import { IntentName } from '@/lib/services/runtime/types';

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
    it('Command.NEXT', async () => {
      const output = 'output';

      const context = 'context';
      const utils = {
        buildContext: sinon.stub().returns(context),
        IntentHandler: { handle: sinon.stub().returns(output) },
      };

      const handler = PlaybackControllerHandlerGenerator(utils as any);

      const input = { requestEnvelope: { request: { type: `PlaybackController.${Command.NEXT}` } } };
      expect(await handler.handle(input as any)).to.eql(output);
      expect(utils.IntentHandler.handle.args[0][0].requestEnvelope.request.intent).to.eql({ name: IntentName.NEXT, confirmationStatus: 'NONE' });
    });

    it('Command.PREV', async () => {
      const output = 'output';

      const context = 'context';
      const utils = {
        buildContext: sinon.stub().returns(context),
        IntentHandler: { handle: sinon.stub().returns(output) },
      };

      const handler = PlaybackControllerHandlerGenerator(utils as any);

      const input = { requestEnvelope: { request: { type: `PlaybackController.${Command.PREV}` } } };
      expect(await handler.handle(input as any)).to.eql(output);
      expect(utils.IntentHandler.handle.args[0][0].requestEnvelope.request.intent).to.eql({ name: IntentName.PREV, confirmationStatus: 'NONE' });
    });

    it('Command.PLAY', async () => {
      const output = 'output';

      const context = 'context';
      const utils = {
        buildContext: sinon.stub().returns(context),
        IntentHandler: { handle: sinon.stub().returns(output) },
      };

      const handler = PlaybackControllerHandlerGenerator(utils as any);

      const input = { requestEnvelope: { request: { type: `PlaybackController.${Command.PLAY}` } } };
      expect(await handler.handle(input as any)).to.eql(output);
      expect(utils.IntentHandler.handle.args[0][0].requestEnvelope.request.intent).to.eql({ name: IntentName.RESUME, confirmationStatus: 'NONE' });
    });

    it('Command.PAUSE', async () => {
      const output = 'output';

      const context = 'context';
      const utils = {
        buildContext: sinon.stub().returns(context),
        IntentHandler: { handle: sinon.stub().returns(output) },
      };

      const handler = PlaybackControllerHandlerGenerator(utils as any);

      const input = { requestEnvelope: { request: { type: `PlaybackController.${Command.PAUSE}` } } };
      expect(await handler.handle(input as any)).to.eql(output);
      expect(utils.IntentHandler.handle.args[0][0].requestEnvelope.request.intent).to.eql({ name: IntentName.PAUSE, confirmationStatus: 'NONE' });
    });

    it('Other Intent', async () => {
      const output = 'output';

      const context = 'context';
      const utils = {
        buildContext: sinon.stub().returns(context),
        IntentHandler: { handle: sinon.stub().returns(output) },
      };

      const handler = PlaybackControllerHandlerGenerator(utils as any);

      const input = { requestEnvelope: { request: { type: 'PlaybackController.UNKNOWN' } } };
      expect(await handler.handle(input as any)).to.eql(output);
      expect(utils.IntentHandler.handle.args[0][0].requestEnvelope.request.intent).to.eql({ name: IntentName.FALLBACK, confirmationStatus: 'NONE' });
    });
  });
});
