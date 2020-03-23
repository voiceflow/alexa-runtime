import { expect } from 'chai';
import sinon from 'sinon';

import { S } from '@/lib/constants';
import AudioPlayerEventHandler, { AudioEvent, AudioPlayerEventHandlerGenerator, Request } from '@/lib/services/alexa/handlers/audioPlayerEvent';
import { AudioDirective, StreamAction } from '@/lib/services/voiceflow/handlers/stream';

describe('audio player event handler unit test', () => {
  describe('canHandle', () => {
    it('false', () => {
      expect(AudioPlayerEventHandler.canHandle({ requestEnvelope: { request: { type: 'random' } } } as any)).to.eql(false);
    });

    it('true', () => {
      expect(AudioPlayerEventHandler.canHandle({ requestEnvelope: { request: { type: `${Request.AUDIO_PLAYER}random` } } } as any)).to.eql(true);
    });
  });

  describe('handle', () => {
    it('no event name', async () => {
      const context = { storage: null };
      const voiceflow = { createContext: sinon.stub().returns(context) };
      const input = {
        context: { versionID: 'version-id', voiceflow },
        attributesManager: { getPersistentAttributes: sinon.stub().resolves({}) },
        requestEnvelope: { request: { type: 'random' } },
      };

      await expect(AudioPlayerEventHandler.handle(input as any)).to.eventually.rejectedWith('cannot handle event');
    });

    it('AudioEvent.PlaybackFailed', async () => {
      const output = 'output';
      const initialRawState = 'initial-raw-state';
      const rawState = 'raw-state';

      const context = { storage: null, getRawState: sinon.stub().returns(rawState) };
      const voiceflow = { createContext: sinon.stub().returns(context) };
      const input = {
        context: { versionID: 'version-id', voiceflow },
        attributesManager: { getPersistentAttributes: sinon.stub().resolves(initialRawState), setPersistentAttributes: sinon.stub() },
        requestEnvelope: { request: { type: `${Request.AUDIO_PLAYER}${AudioEvent.PlaybackFailed}` } },
        responseBuilder: { getResponse: sinon.stub().returns(output) },
      };

      expect(await AudioPlayerEventHandler.handle(input as any)).to.eql(output);
      expect(input.attributesManager.getPersistentAttributes.callCount).to.eql(1);
      expect(voiceflow.createContext.args).to.eql([[input.context.versionID, initialRawState]]);
      expect(input.attributesManager.setPersistentAttributes.args).to.eql([[rawState]]);
    });

    it('AudioEvent.PlaybackStopped', async () => {
      const output = 'output';

      const context = { storage: null, getRawState: sinon.stub().returns({}) };
      const voiceflow = { createContext: sinon.stub().returns(context) };
      const input = {
        context: { versionID: 'version-id', voiceflow },
        attributesManager: { getPersistentAttributes: sinon.stub().resolves({}), setPersistentAttributes: sinon.stub() },
        requestEnvelope: { request: { type: `${Request.AUDIO_PLAYER}${AudioEvent.PlaybackStopped}` } },
        responseBuilder: { getResponse: sinon.stub().returns(output) },
      };

      expect(await AudioPlayerEventHandler.handle(input as any)).to.eql(output);
    });

    it('AudioEvent.PlaybackFinished', async () => {
      const output = 'output';

      const context = { storage: { set: sinon.stub() }, getRawState: sinon.stub().returns({}) };
      const voiceflow = { createContext: sinon.stub().returns(context) };
      const input = {
        context: { versionID: 'version-id', voiceflow },
        attributesManager: { getPersistentAttributes: sinon.stub().resolves({}), setPersistentAttributes: sinon.stub() },
        requestEnvelope: { request: { type: `${Request.AUDIO_PLAYER}${AudioEvent.PlaybackFinished}` } },
        responseBuilder: { getResponse: sinon.stub().returns(output) },
      };

      expect(await AudioPlayerEventHandler.handle(input as any)).to.eql(output);
      expect(context.storage.set.args).to.eql([[S.STREAM_FINISHED, true]]);
    });

    describe('AudioEvent.PlaybackStarted', () => {
      it('no stream finished', async () => {
        const output = 'output';

        const context = { storage: { get: sinon.stub().returns(null), delete: sinon.stub() }, getRawState: sinon.stub().returns({}) };
        const voiceflow = { createContext: sinon.stub().returns(context) };
        const input = {
          context: { versionID: 'version-id', voiceflow },
          attributesManager: { getPersistentAttributes: sinon.stub().resolves({}), setPersistentAttributes: sinon.stub() },
          requestEnvelope: { request: { type: `${Request.AUDIO_PLAYER}${AudioEvent.PlaybackStarted}` } },
          responseBuilder: { getResponse: sinon.stub().returns(output) },
        };

        expect(await AudioPlayerEventHandler.handle(input as any)).to.eql(output);
        expect(context.storage.get.callCount).to.eql(1);
        expect(context.storage.delete.args).to.eql([[S.STREAM_FINISHED]]);
      });

      it('no stream temp', async () => {
        const output = 'output';

        const context = {
          storage: {
            get: sinon
              .stub()
              .onFirstCall()
              .returns({})
              .returns(null),
            delete: sinon.stub(),
          },
          getRawState: sinon.stub().returns({}),
        };
        const voiceflow = { createContext: sinon.stub().returns(context) };
        const input = {
          context: { versionID: 'version-id', voiceflow },
          attributesManager: { getPersistentAttributes: sinon.stub().resolves({}), setPersistentAttributes: sinon.stub() },
          requestEnvelope: { request: { type: `${Request.AUDIO_PLAYER}${AudioEvent.PlaybackStarted}` } },
          responseBuilder: { getResponse: sinon.stub().returns(output) },
        };

        expect(await AudioPlayerEventHandler.handle(input as any)).to.eql(output);
        expect(context.storage.get.callCount).to.eql(2);
        expect(context.storage.delete.args).to.eql([[S.STREAM_FINISHED]]);
      });

      it('stream finished and stream temp', async () => {
        const output = 'output';

        const firstRaw = 'first-raw';
        const streamTemp = { foo: 'bar' };
        const storageGet = sinon
          .stub()
          .onFirstCall()
          .returns({})
          .returns(streamTemp);
        const context = { storage: { get: storageGet, delete: sinon.stub() }, getRawState: sinon.stub().returns(firstRaw) };
        const secondRaw = 'second-raw';
        const newContext = { getRawState: sinon.stub().returns(secondRaw) };
        const voiceflow = {
          createContext: sinon
            .stub()
            .onFirstCall()
            .returns(context)
            .onSecondCall()
            .returns(newContext),
        };
        const input = {
          context: { versionID: 'version-id', voiceflow },
          attributesManager: { getPersistentAttributes: sinon.stub().resolves({}), setPersistentAttributes: sinon.stub() },
          requestEnvelope: { request: { type: `${Request.AUDIO_PLAYER}${AudioEvent.PlaybackStarted}` } },
          responseBuilder: { getResponse: sinon.stub().returns(output) },
        };

        expect(await AudioPlayerEventHandler.handle(input as any)).to.eql(output);
        expect(context.storage.get.callCount).to.eql(3);
        expect(voiceflow.createContext.callCount).to.eql(2);
        expect(input.attributesManager.setPersistentAttributes.args).to.eql([[secondRaw]]);
      });
    });

    describe('AudioEvent.PlaybackNearlyFinished', () => {
      it('no stream play', async () => {
        const output = 'output';

        const context = { storage: { get: sinon.stub().returns(null) }, getRawState: sinon.stub().returns({}) };
        const voiceflow = { createContext: sinon.stub().returns(context) };
        const input = {
          context: { versionID: 'version-id', voiceflow },
          attributesManager: { getPersistentAttributes: sinon.stub().resolves({}), setPersistentAttributes: sinon.stub() },
          requestEnvelope: { request: { type: `${Request.AUDIO_PLAYER}${AudioEvent.PlaybackNearlyFinished}` } },
          responseBuilder: { getResponse: sinon.stub().returns(output) },
        };

        expect(await AudioPlayerEventHandler.handle(input as any)).to.eql(output);
      });

      it('stream but no if', async () => {
        const output = 'output';

        const context = { storage: { get: sinon.stub().returns({}) }, getRawState: sinon.stub().returns({}) };
        const voiceflow = { createContext: sinon.stub().returns(context) };
        const input = {
          context: { versionID: 'version-id', voiceflow },
          attributesManager: { getPersistentAttributes: sinon.stub().resolves({}), setPersistentAttributes: sinon.stub() },
          requestEnvelope: { request: { type: `${Request.AUDIO_PLAYER}${AudioEvent.PlaybackNearlyFinished}` } },
          responseBuilder: { getResponse: sinon.stub().returns(output) },
        };

        expect(await AudioPlayerEventHandler.handle(input as any)).to.eql(output);
      });

      describe('stream loop', () => {
        it('no url', async () => {
          const utils = { _streamMetaData: sinon.stub().returns({}) };
          const handler = AudioPlayerEventHandlerGenerator(utils as any);
          const output = 'output';

          const context = { storage: { get: sinon.stub().returns({ loop: true }) }, getRawState: sinon.stub().returns({}) };
          const voiceflow = { createContext: sinon.stub().returns(context) };
          const input = {
            context: { versionID: 'version-id', voiceflow },
            attributesManager: { getPersistentAttributes: sinon.stub().resolves({}), setPersistentAttributes: sinon.stub() },
            requestEnvelope: { request: { type: `${Request.AUDIO_PLAYER}${AudioEvent.PlaybackNearlyFinished}` } },
            responseBuilder: { getResponse: sinon.stub().returns(output) },
          };

          expect(await handler.handle(input as any)).to.eql(output);
        });

        it('url but no token', async () => {
          const utils = { _streamMetaData: sinon.stub().returns({ url: 'url' }) };
          const handler = AudioPlayerEventHandlerGenerator(utils as any);
          const output = 'output';

          const context = { storage: { get: sinon.stub().returns({ loop: true }) }, getRawState: sinon.stub().returns({}) };
          const voiceflow = { createContext: sinon.stub().returns(context) };
          const input = {
            context: { versionID: 'version-id', voiceflow },
            attributesManager: { getPersistentAttributes: sinon.stub().resolves({}), setPersistentAttributes: sinon.stub() },
            requestEnvelope: { request: { type: `${Request.AUDIO_PLAYER}${AudioEvent.PlaybackNearlyFinished}` } },
            responseBuilder: { getResponse: sinon.stub().returns(output) },
          };

          expect(await handler.handle(input as any)).to.eql(output);
        });

        it('works correctly', async () => {
          const metadata = { url: 'url', token: 'token', metaData: 'metaData' };
          const utils = { _streamMetaData: sinon.stub().returns(metadata) };
          const handler = AudioPlayerEventHandlerGenerator(utils as any);
          const output = 'output';

          const context = { storage: { produce: sinon.stub(), get: sinon.stub().returns({ loop: true }) }, getRawState: sinon.stub().returns({}) };
          const voiceflow = { createContext: sinon.stub().returns(context) };
          const input = {
            context: { versionID: 'version-id', voiceflow },
            attributesManager: { getPersistentAttributes: sinon.stub().resolves({}), setPersistentAttributes: sinon.stub() },
            requestEnvelope: { request: { type: `${Request.AUDIO_PLAYER}${AudioEvent.PlaybackNearlyFinished}` } },
            responseBuilder: { getResponse: sinon.stub().returns(output), addAudioPlayerPlayDirective: sinon.stub() },
          };

          expect(await handler.handle(input as any)).to.eql(output);
          expect(input.responseBuilder.addAudioPlayerPlayDirective.args).to.eql([
            [AudioDirective.ENQUEUE, metadata.url, metadata.token, 0, metadata.token, metadata.metaData],
          ]);

          const produceCallback = context.storage.produce.args[0][0];
          const draft = { [S.STREAM_PLAY]: { token: 'random' } };
          produceCallback(draft);
          expect(draft[S.STREAM_PLAY]).to.eql({ token: metadata.token });
        });
      });

      describe('stream action resume', () => {
        it('no url', async () => {
          const utils = { _streamMetaData: sinon.stub().returns({}) };
          const handler = AudioPlayerEventHandlerGenerator(utils as any);
          const output = 'output';

          const context = {
            storage: {
              get: sinon
                .stub()
                .onFirstCall()
                .returns({ action: StreamAction.RESUME })
                .returns({}),
            },
            getRawState: sinon.stub().returns({}),
          };
          const voiceflow = { createContext: sinon.stub().returns(context) };
          const input = {
            context: { versionID: 'version-id', voiceflow },
            attributesManager: { getPersistentAttributes: sinon.stub().resolves({}), setPersistentAttributes: sinon.stub() },
            requestEnvelope: { request: { type: `${Request.AUDIO_PLAYER}${AudioEvent.PlaybackNearlyFinished}` } },
            responseBuilder: { getResponse: sinon.stub().returns(output) },
          };

          expect(await handler.handle(input as any)).to.eql(output);
        });

        it('url but no token', async () => {
          const utils = { _streamMetaData: sinon.stub().returns({ url: '' }) };
          const handler = AudioPlayerEventHandlerGenerator(utils as any);
          const output = 'output';

          const context = {
            storage: {
              get: sinon
                .stub()
                .onFirstCall()
                .returns({ action: StreamAction.RESUME })
                .returns({}),
            },
            getRawState: sinon.stub().returns({}),
          };
          const voiceflow = { createContext: sinon.stub().returns(context) };
          const input = {
            context: { versionID: 'version-id', voiceflow },
            attributesManager: { getPersistentAttributes: sinon.stub().resolves({}), setPersistentAttributes: sinon.stub() },
            requestEnvelope: { request: { type: `${Request.AUDIO_PLAYER}${AudioEvent.PlaybackNearlyFinished}` } },
            responseBuilder: { getResponse: sinon.stub().returns(output) },
          };

          expect(await handler.handle(input as any)).to.eql(output);
        });

        it('works correctly', async () => {
          const metadata = { url: 'url', token: 'token', metaData: 'metaData' };
          const utils = { _streamMetaData: sinon.stub().returns(metadata) };
          const handler = AudioPlayerEventHandlerGenerator(utils as any);
          const output = 'output';

          const streamPlay = { action: StreamAction.RESUME, token: 'stream token' };
          const streamTemp = { [S.STREAM_PLAY]: { foo: 'bar' } };
          const storageGet = sinon.stub();
          storageGet.withArgs(S.STREAM_PLAY).returns(streamPlay);
          storageGet.withArgs(S.STREAM_TEMP).returns(streamTemp);
          const context = {
            storage: {
              produce: sinon.stub(),
              get: storageGet,
            },
            getRawState: sinon.stub().returns({}),
          };
          const voiceflow = { createContext: sinon.stub().returns(context) };
          const input = {
            context: { versionID: 'version-id', voiceflow },
            attributesManager: { getPersistentAttributes: sinon.stub().resolves({}), setPersistentAttributes: sinon.stub() },
            requestEnvelope: { request: { type: `${Request.AUDIO_PLAYER}${AudioEvent.PlaybackNearlyFinished}` } },
            responseBuilder: { getResponse: sinon.stub().returns(output), addAudioPlayerPlayDirective: sinon.stub() },
          };

          expect(await handler.handle(input as any)).to.eql(output);
          expect(input.responseBuilder.addAudioPlayerPlayDirective.args).to.eql([
            [AudioDirective.ENQUEUE, metadata.url, metadata.token, 0, streamPlay.token, metadata.metaData],
          ]);

          const produceCallback = context.storage.produce.args[0][0];
          const draft = { [S.STREAM_TEMP]: { [S.STREAM_PLAY]: { token: 'random' } } };
          produceCallback(draft);
          expect(draft[S.STREAM_TEMP][S.STREAM_PLAY]).to.eql({ token: metadata.token });
        });
      });

      describe('stream action start', () => {
        it('temp action not start', async () => {
          const utils = { update: sinon.stub() };
          const handler = AudioPlayerEventHandlerGenerator(utils as any);
          const output = 'output';

          const storageGet = sinon.stub();
          storageGet.withArgs(S.STREAM_PLAY).returns({ action: StreamAction.START });
          storageGet.withArgs(S.STREAM_TEMP).returns(null);

          const context = { storage: { get: storageGet }, getRawState: sinon.stub().returns({}) };
          const tempContext = { storage: { get: sinon.stub().returns({ action: 'random' }), set: sinon.stub() } };
          const voiceflow = {
            createContext: sinon
              .stub()
              .onFirstCall()
              .returns(context)
              .returns(tempContext),
          };
          const input = {
            context: { versionID: 'version-id', voiceflow },
            attributesManager: { getPersistentAttributes: sinon.stub().resolves({}), setPersistentAttributes: sinon.stub() },
            requestEnvelope: { request: { type: `${Request.AUDIO_PLAYER}${AudioEvent.PlaybackNearlyFinished}` } },
            responseBuilder: { getResponse: sinon.stub().returns(output) },
          };

          expect(await handler.handle(input as any)).to.eql(output);
          expect(voiceflow.createContext.callCount).to.eql(2);
          expect(tempContext.storage.set.args).to.eql([[S.STREAM_PLAY, { action: StreamAction.NEXT }]]);
          expect(utils.update.callCount).to.eql(1);
        });

        it('no temp', async () => {
          const utils = { update: sinon.stub() };
          const handler = AudioPlayerEventHandlerGenerator(utils as any);
          const output = 'output';

          const storageGet = sinon.stub();
          storageGet.withArgs(S.STREAM_PLAY).returns({ action: StreamAction.START });
          storageGet.withArgs(S.STREAM_TEMP).returns(null);

          const context = { storage: { get: storageGet }, getRawState: sinon.stub().returns({}) };
          const tempContext = { storage: { get: sinon.stub().returns(null), set: sinon.stub() } };
          const voiceflow = {
            createContext: sinon
              .stub()
              .onFirstCall()
              .returns(context)
              .returns(tempContext),
          };
          const input = {
            context: { versionID: 'version-id', voiceflow },
            attributesManager: { getPersistentAttributes: sinon.stub().resolves({}), setPersistentAttributes: sinon.stub() },
            requestEnvelope: { request: { type: `${Request.AUDIO_PLAYER}${AudioEvent.PlaybackNearlyFinished}` } },
            responseBuilder: { getResponse: sinon.stub().returns(output) },
          };

          expect(await handler.handle(input as any)).to.eql(output);
        });

        it('temp but no url', async () => {
          const utils = { update: sinon.stub(), _streamMetaData: sinon.stub().returns({}) };
          const handler = AudioPlayerEventHandlerGenerator(utils as any);
          const output = 'output';

          const storageGet = sinon.stub();
          storageGet.withArgs(S.STREAM_PLAY).returns({ action: StreamAction.START });
          storageGet.withArgs(S.STREAM_TEMP).returns(null);

          const context = { storage: { get: storageGet, set: sinon.stub() }, getRawState: sinon.stub().returns({}) };
          const tempContextRaw = 'temp-raw';
          const tempContext = {
            storage: { get: sinon.stub().returns({ action: StreamAction.START }), set: sinon.stub() },
            getRawState: sinon.stub().returns(tempContextRaw),
          };
          const voiceflow = {
            createContext: sinon
              .stub()
              .onFirstCall()
              .returns(context)
              .returns(tempContext),
          };
          const input = {
            context: { versionID: 'version-id', voiceflow },
            attributesManager: { getPersistentAttributes: sinon.stub().resolves({}), setPersistentAttributes: sinon.stub() },
            requestEnvelope: { request: { type: `${Request.AUDIO_PLAYER}${AudioEvent.PlaybackNearlyFinished}` } },
            responseBuilder: { getResponse: sinon.stub().returns(output) },
          };

          expect(await handler.handle(input as any)).to.eql(output);
          expect(context.storage.set.args).to.eql([[S.STREAM_TEMP, tempContextRaw]]);
        });

        it('temp and url but no token', async () => {
          const utils = { update: sinon.stub(), _streamMetaData: sinon.stub().returns({ url: 'url' }) };
          const handler = AudioPlayerEventHandlerGenerator(utils as any);
          const output = 'output';

          const storageGet = sinon.stub();
          storageGet.withArgs(S.STREAM_PLAY).returns({ action: StreamAction.START });
          storageGet.withArgs(S.STREAM_TEMP).returns(null);

          const context = { storage: { get: storageGet, set: sinon.stub() }, getRawState: sinon.stub().returns({}) };
          const tempContextRaw = 'temp-raw';
          const tempContext = {
            storage: { get: sinon.stub().returns({ action: StreamAction.START }), set: sinon.stub() },
            getRawState: sinon.stub().returns(tempContextRaw),
          };
          const voiceflow = {
            createContext: sinon
              .stub()
              .onFirstCall()
              .returns(context)
              .returns(tempContext),
          };
          const input = {
            context: { versionID: 'version-id', voiceflow },
            attributesManager: { getPersistentAttributes: sinon.stub().resolves({}), setPersistentAttributes: sinon.stub() },
            requestEnvelope: { request: { type: `${Request.AUDIO_PLAYER}${AudioEvent.PlaybackNearlyFinished}` } },
            responseBuilder: { getResponse: sinon.stub().returns(output) },
          };

          expect(await handler.handle(input as any)).to.eql(output);
          expect(context.storage.set.args).to.eql([[S.STREAM_TEMP, tempContextRaw]]);
        });

        it('temp, url and token', async () => {
          const metadata = { url: 'url', token: 'token', metaData: 'metaData' };
          const utils = { update: sinon.stub(), _streamMetaData: sinon.stub().returns(metadata) };
          const handler = AudioPlayerEventHandlerGenerator(utils as any);
          const output = 'output';

          const streamPlay = { action: StreamAction.START, token: 'old-token' };
          const storageGet = sinon.stub();
          storageGet.withArgs(S.STREAM_PLAY).returns(streamPlay);
          storageGet.withArgs(S.STREAM_TEMP).returns(null);

          const context = { storage: { get: storageGet, set: sinon.stub() }, getRawState: sinon.stub().returns({}) };
          const tempContextRaw = 'temp-raw';
          const tempContext = {
            storage: { produce: sinon.stub(), get: sinon.stub().returns({ action: StreamAction.START }), set: sinon.stub() },
            getRawState: sinon.stub().returns(tempContextRaw),
          };
          const voiceflow = {
            createContext: sinon
              .stub()
              .onFirstCall()
              .returns(context)
              .returns(tempContext),
          };
          const input = {
            context: { versionID: 'version-id', voiceflow },
            attributesManager: { getPersistentAttributes: sinon.stub().resolves({}), setPersistentAttributes: sinon.stub() },
            requestEnvelope: { request: { type: `${Request.AUDIO_PLAYER}${AudioEvent.PlaybackNearlyFinished}` } },
            responseBuilder: { addAudioPlayerPlayDirective: sinon.stub(), getResponse: sinon.stub().returns(output) },
          };

          expect(await handler.handle(input as any)).to.eql(output);
          expect(input.responseBuilder.addAudioPlayerPlayDirective.args).to.eql([
            [AudioDirective.ENQUEUE, metadata.url, metadata.token, 0, streamPlay.token, metadata.metaData],
          ]);

          const tempProduceCallback = tempContext.storage.produce.args[0][0];
          const draft = { [S.STREAM_PLAY]: { token: 'random' } };
          tempProduceCallback(draft);
          expect(draft[S.STREAM_PLAY].token).to.eql(metadata.token);
        });
      });
    });
  });
});
