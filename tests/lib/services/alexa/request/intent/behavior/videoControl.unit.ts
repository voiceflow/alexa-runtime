import { expect } from 'chai';
import sinon from 'sinon';

import VideoControlHandler from '@/lib/services/alexa/request/intent/behavior/videoControl';
import { VideoCommand, VideoCommandType } from '@/lib/services/runtime/handlers/display/types';
import { IntentName } from '@/lib/services/runtime/types';

describe('video control handler', () => {
  describe('canHandle', () => {
    describe('false', () => {
      it('no displayInfo', () => {
        const runtime = { storage: { get: sinon.stub().returns(null) } };
        const input = { requestEnvelope: {} };
        expect(VideoControlHandler.canHandle(input as any, runtime as any)).to.eql(false);
      });

      it('playingVideos empty obj', () => {
        const runtime = { storage: { get: sinon.stub().returns({ playingVideos: {} }) } };
        const input = { requestEnvelope: {} };
        expect(VideoControlHandler.canHandle(input as any, runtime as any)).to.eql(false);
      });

      it('intent name not in MEDIA_CONTROL_INTENTS', () => {
        const runtime = { storage: { get: sinon.stub().returns({ playingVideos: { foo: 'bar' } }) } };
        const input = {
          requestEnvelope: { request: { intent: { name: 'random' } } },
        };
        expect(VideoControlHandler.canHandle(input as any, runtime as any)).to.eql(false);
      });
    });

    describe('true', () => {
      it('intent name pause', () => {
        const runtime = { storage: { get: sinon.stub().returns({ playingVideos: { foo: 'bar' } }) } };
        const input = {
          requestEnvelope: { request: { intent: { name: IntentName.PAUSE } } },
        };
        expect(VideoControlHandler.canHandle(input as any, runtime as any)).to.eql(true);
      });

      it('intent name resume', () => {
        const runtime = { storage: { get: sinon.stub().returns({ playingVideos: { foo: 'bar' } }) } };
        const input = {
          requestEnvelope: { request: { intent: { name: IntentName.RESUME } } },
        };
        expect(VideoControlHandler.canHandle(input as any, runtime as any)).to.eql(true);
      });
    });
  });

  describe('handle', () => {
    it('no commands', async () => {
      const output = 'output';
      const runtime = { storage: { get: sinon.stub().returns({ playingVideos: {} }) } };
      const input = {
        requestEnvelope: { request: { intent: { name: IntentName.PAUSE } } },
        responseBuilder: { getResponse: sinon.stub().returns(output) },
      };

      expect(await VideoControlHandler.handle(input as any, runtime as any)).to.eql(output);
    });

    it('with commands', async () => {
      const output = 'output';
      const runtime = {
        versionID: 'version-id',
        storage: { get: sinon.stub().returns({ playingVideos: { id1: 'hello' } }) },
      };
      const input = {
        requestEnvelope: { request: { intent: { name: IntentName.RESUME } } },
        responseBuilder: { getResponse: sinon.stub().returns(output), addDirective: sinon.stub() },
      };

      expect(await VideoControlHandler.handle(input as any, runtime as any)).to.eql(output);
      expect(input.responseBuilder.addDirective.args).to.eql([
        [
          {
            type: 'Alexa.Presentation.APL.ExecuteCommands',
            token: runtime.versionID,
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
