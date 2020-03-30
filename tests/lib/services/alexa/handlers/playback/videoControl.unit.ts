import { expect } from 'chai';
import sinon from 'sinon';

import VideoControlHandler, { VideoCommand, VideoCommandType } from '@/lib/services/alexa/handlers/playback/videoControl';
import { IntentName } from '@/lib/services/voiceflow/types';

describe('video control handler', () => {
  describe('canHandle', () => {
    describe('false', () => {
      it('no displayInfo', () => {
        const input = { context: { context: { storage: { get: sinon.stub().returns(null) } } }, requestEnvelope: {} };
        expect(VideoControlHandler.canHandle(input as any)).to.eql(false);
      });

      it('no playingVideos', () => {
        const input = { context: { context: { storage: { get: sinon.stub().returns({}) } } }, requestEnvelope: {} };
        expect(VideoControlHandler.canHandle(input as any)).to.eql(false);
      });

      it('playingVideos empty obj', () => {
        const input = { context: { context: { storage: { get: sinon.stub().returns({ playingVideos: {} }) } } }, requestEnvelope: {} };
        expect(VideoControlHandler.canHandle(input as any)).to.eql(false);
      });

      it('intent name not in MEDIA_CONTROL_INTENTS', () => {
        const input = {
          context: { context: { storage: { get: sinon.stub().returns({ playingVideos: { foo: 'bar' } }) } } },
          requestEnvelope: { request: { intent: { name: 'random' } } },
        };
        expect(VideoControlHandler.canHandle(input as any)).to.eql(false);
      });
    });

    describe('true', () => {
      it('intent name pause', () => {
        const input = {
          context: { context: { storage: { get: sinon.stub().returns({ playingVideos: { foo: 'bar' } }) } } },
          requestEnvelope: { request: { intent: { name: IntentName.PAUSE } } },
        };
        expect(VideoControlHandler.canHandle(input as any)).to.eql(true);
      });

      it('intent name resume', () => {
        const input = {
          context: { context: { storage: { get: sinon.stub().returns({ playingVideos: { foo: 'bar' } }) } } },
          requestEnvelope: { request: { intent: { name: IntentName.RESUME } } },
        };
        expect(VideoControlHandler.canHandle(input as any)).to.eql(true);
      });
    });
  });

  describe('handle', () => {
    it('no commands', async () => {
      const output = 'output';
      const input = {
        context: { context: { storage: { get: sinon.stub().returns({ playingVideos: {} }) } } },
        requestEnvelope: { request: { intent: { name: IntentName.PAUSE } } },
        responseBuilder: { getResponse: sinon.stub().returns(output) },
      };

      expect(await VideoControlHandler.handle(input as any)).to.eql(output);
    });

    it('with commands', async () => {
      const output = 'output';
      const input = {
        context: { context: { versionID: 'version-id', storage: { get: sinon.stub().returns({ playingVideos: { id1: 'hello' } }) } } },
        requestEnvelope: { request: { intent: { name: IntentName.RESUME } } },
        responseBuilder: { getResponse: sinon.stub().returns(output), addDirective: sinon.stub() },
      };

      expect(await VideoControlHandler.handle(input as any)).to.eql(output);
      expect(input.responseBuilder.addDirective.args).to.eql([
        [
          {
            type: 'Alexa.Presentation.APL.ExecuteCommands',
            token: input.context.context.versionID,
            commands: [
              {
                type: VideoCommandType.CONTROL_MEDIA,
                command: VideoCommand.PLAY,
                componentId: 'id1',
              },
            ],
          },
        ],
      ]);
    });
  });
});
