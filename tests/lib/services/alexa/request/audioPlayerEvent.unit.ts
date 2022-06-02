import { expect } from 'chai';
import sinon from 'sinon';

import { S } from '@/lib/constants';
import AudioPlayerEventHandler, {
  AudioEvent,
  AudioPlayerEventHandlerGenerator,
} from '@/lib/services/alexa/request/audioPlayerEvent';
import { Request } from '@/lib/services/alexa/types';
import { AudioDirective, StreamAction } from '@/lib/services/runtime/handlers/stream';

describe('audio player event handler unit test', () => {
  describe('canHandle', () => {
    it('false', () => {
      expect(AudioPlayerEventHandler.canHandle({ requestEnvelope: { request: { type: 'random' } } } as any)).to.eql(
        false
      );
    });

    it('true', () => {
      expect(
        AudioPlayerEventHandler.canHandle({
          requestEnvelope: { request: { type: `${Request.AUDIO_PLAYER}random` } },
        } as any)
      ).to.eql(true);
    });
  });

  describe('handle', () => {
    it('no event name', async () => {
      const runtime = { storage: null };
      const runtimeClient = { createRuntime: sinon.stub().returns(runtime) };
      const input = {
        context: { versionID: 'version-id', runtimeClient },
        attributesManager: { getPersistentAttributes: sinon.stub().resolves({}) },
        requestEnvelope: { request: { type: 'random' } },
      };

      await expect(AudioPlayerEventHandler.handle(input as any)).to.eventually.rejectedWith('cannot handle event');
    });

    it('AudioEvent.PlaybackFailed', async () => {
      const output = 'output';
      const initialRawState = 'initial-raw-state';
      const rawState = 'raw-state';

      const runtime = { storage: null, getRawState: sinon.stub().returns(rawState) };
      const runtimeClient = { createRuntime: sinon.stub().returns(runtime) };
      const input = {
        context: { versionID: 'version-id', runtimeClient },
        attributesManager: {
          getPersistentAttributes: sinon.stub().resolves(initialRawState),
          setPersistentAttributes: sinon.stub(),
        },
        requestEnvelope: { request: { type: `${Request.AUDIO_PLAYER}${AudioEvent.PlaybackFailed}` } },
        responseBuilder: { getResponse: sinon.stub().returns(output) },
      };

      expect(await AudioPlayerEventHandler.handle(input as any)).to.eql(output);
      expect(input.attributesManager.getPersistentAttributes.callCount).to.eql(1);
      expect(runtimeClient.createRuntime.args).to.eql([[input.context.versionID, initialRawState]]);
      expect(input.attributesManager.setPersistentAttributes.args).to.eql([[rawState]]);
    });

    it('AudioEvent.PlaybackStopped', async () => {
      const output = 'output';

      const runtime = { storage: null, getRawState: sinon.stub().returns({}) };
      const runtimeClient = { createRuntime: sinon.stub().returns(runtime) };
      const input = {
        context: { versionID: 'version-id', runtimeClient },
        attributesManager: {
          getPersistentAttributes: sinon.stub().resolves({}),
          setPersistentAttributes: sinon.stub(),
        },
        requestEnvelope: { request: { type: `${Request.AUDIO_PLAYER}${AudioEvent.PlaybackStopped}` } },
        responseBuilder: { getResponse: sinon.stub().returns(output) },
      };

      expect(await AudioPlayerEventHandler.handle(input as any)).to.eql(output);
    });

    it('AudioEvent.PlaybackFinished', async () => {
      const output = 'output';

      const runtime = { storage: { set: sinon.stub() }, getRawState: sinon.stub().returns({}) };
      const runtimeClient = { createRuntime: sinon.stub().returns(runtime) };
      const input = {
        context: { versionID: 'version-id', runtimeClient },
        attributesManager: {
          getPersistentAttributes: sinon.stub().resolves({}),
          setPersistentAttributes: sinon.stub(),
        },
        requestEnvelope: { request: { type: `${Request.AUDIO_PLAYER}${AudioEvent.PlaybackFinished}` } },
        responseBuilder: { getResponse: sinon.stub().returns(output) },
      };

      expect(await AudioPlayerEventHandler.handle(input as any)).to.eql(output);
      expect(runtime.storage.set.args).to.eql([[S.STREAM_FINISHED, true]]);
    });

    describe('AudioEvent.PlaybackStarted', () => {
      it('no stream finished', async () => {
        const output = 'output';

        const runtime = {
          storage: { get: sinon.stub().returns(null), delete: sinon.stub() },
          getRawState: sinon.stub().returns({}),
        };
        const runtimeClient = { createRuntime: sinon.stub().returns(runtime) };
        const input = {
          context: { versionID: 'version-id', runtimeClient },
          attributesManager: {
            getPersistentAttributes: sinon.stub().resolves({}),
            setPersistentAttributes: sinon.stub(),
          },
          requestEnvelope: { request: { type: `${Request.AUDIO_PLAYER}${AudioEvent.PlaybackStarted}` } },
          responseBuilder: { getResponse: sinon.stub().returns(output) },
        };

        expect(await AudioPlayerEventHandler.handle(input as any)).to.eql(output);
        expect(runtime.storage.get.callCount).to.eql(1);
        expect(runtime.storage.delete.args).to.eql([[S.STREAM_FINISHED]]);
      });

      it('no stream temp', async () => {
        const output = 'output';

        const runtime = {
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
        const runtimeClient = { createRuntime: sinon.stub().returns(runtime) };
        const input = {
          context: { versionID: 'version-id', runtimeClient },
          attributesManager: {
            getPersistentAttributes: sinon.stub().resolves({}),
            setPersistentAttributes: sinon.stub(),
          },
          requestEnvelope: { request: { type: `${Request.AUDIO_PLAYER}${AudioEvent.PlaybackStarted}` } },
          responseBuilder: { getResponse: sinon.stub().returns(output) },
        };

        expect(await AudioPlayerEventHandler.handle(input as any)).to.eql(output);
        expect(runtime.storage.get.callCount).to.eql(2);
        expect(runtime.storage.delete.args).to.eql([[S.STREAM_FINISHED]]);
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
        const runtime = {
          storage: { get: storageGet, delete: sinon.stub() },
          getRawState: sinon.stub().returns(firstRaw),
        };
        const secondRaw = 'second-raw';
        const newContext = { getRawState: sinon.stub().returns(secondRaw) };
        const runtimeClient = {
          createRuntime: sinon
            .stub()
            .onFirstCall()
            .returns(runtime)
            .onSecondCall()
            .returns(newContext),
        };
        const input = {
          context: { versionID: 'version-id', runtimeClient },
          attributesManager: {
            getPersistentAttributes: sinon.stub().resolves({}),
            setPersistentAttributes: sinon.stub(),
          },
          requestEnvelope: { request: { type: `${Request.AUDIO_PLAYER}${AudioEvent.PlaybackStarted}` } },
          responseBuilder: { getResponse: sinon.stub().returns(output) },
        };

        expect(await AudioPlayerEventHandler.handle(input as any)).to.eql(output);
        expect(runtime.storage.get.callCount).to.eql(3);
        expect(runtimeClient.createRuntime.callCount).to.eql(2);
        expect(input.attributesManager.setPersistentAttributes.args).to.eql([[secondRaw]]);
      });
    });

    describe('AudioEvent.PlaybackNearlyFinished', () => {
      it('no stream play', async () => {
        const output = 'output';

        const runtime = { storage: { get: sinon.stub().returns(null) }, getRawState: sinon.stub().returns({}) };
        const runtimeClient = { createRuntime: sinon.stub().returns(runtime) };
        const input = {
          context: { versionID: 'version-id', runtimeClient },
          attributesManager: {
            getPersistentAttributes: sinon.stub().resolves({}),
            setPersistentAttributes: sinon.stub(),
          },
          requestEnvelope: { request: { type: `${Request.AUDIO_PLAYER}${AudioEvent.PlaybackNearlyFinished}` } },
          responseBuilder: { getResponse: sinon.stub().returns(output) },
        };

        expect(await AudioPlayerEventHandler.handle(input as any)).to.eql(output);
      });

      it('stream but no if', async () => {
        const output = 'output';

        const runtime = { storage: { get: sinon.stub().returns({}) }, getRawState: sinon.stub().returns({}) };
        const runtimeClient = { createRuntime: sinon.stub().returns(runtime) };
        const input = {
          context: { versionID: 'version-id', runtimeClient },
          attributesManager: {
            getPersistentAttributes: sinon.stub().resolves({}),
            setPersistentAttributes: sinon.stub(),
          },
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

          const runtime = {
            storage: { get: sinon.stub().returns({ loop: true }) },
            getRawState: sinon.stub().returns({}),
          };
          const runtimeClient = { createRuntime: sinon.stub().returns(runtime) };
          const input = {
            context: { versionID: 'version-id', runtimeClient },
            attributesManager: {
              getPersistentAttributes: sinon.stub().resolves({}),
              setPersistentAttributes: sinon.stub(),
            },
            requestEnvelope: { request: { type: `${Request.AUDIO_PLAYER}${AudioEvent.PlaybackNearlyFinished}` } },
            responseBuilder: { getResponse: sinon.stub().returns(output) },
          };

          expect(await handler.handle(input as any)).to.eql(output);
        });

        it('url but no token', async () => {
          const utils = { _streamMetaData: sinon.stub().returns({ url: 'url' }) };
          const handler = AudioPlayerEventHandlerGenerator(utils as any);
          const output = 'output';

          const runtime = {
            storage: { get: sinon.stub().returns({ loop: true }) },
            getRawState: sinon.stub().returns({}),
          };
          const runtimeClient = { createRuntime: sinon.stub().returns(runtime) };
          const input = {
            context: { versionID: 'version-id', runtimeClient },
            attributesManager: {
              getPersistentAttributes: sinon.stub().resolves({}),
              setPersistentAttributes: sinon.stub(),
            },
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

          const runtime = {
            storage: { produce: sinon.stub(), get: sinon.stub().returns({ loop: true }) },
            getRawState: sinon.stub().returns({}),
          };
          const runtimeClient = { createRuntime: sinon.stub().returns(runtime) };
          const input = {
            context: { versionID: 'version-id', runtimeClient },
            attributesManager: {
              getPersistentAttributes: sinon.stub().resolves({}),
              setPersistentAttributes: sinon.stub(),
            },
            requestEnvelope: { request: { type: `${Request.AUDIO_PLAYER}${AudioEvent.PlaybackNearlyFinished}` } },
            responseBuilder: { getResponse: sinon.stub().returns(output), addAudioPlayerPlayDirective: sinon.stub() },
          };

          expect(await handler.handle(input as any)).to.eql(output);
          expect(input.responseBuilder.addAudioPlayerPlayDirective.args).to.eql([
            [AudioDirective.ENQUEUE, metadata.url, metadata.token, 0, metadata.token, metadata.metaData],
          ]);

          const produceCallback = runtime.storage.produce.args[0][0];
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

          const runtime = {
            storage: {
              get: sinon
                .stub()
                .onFirstCall()
                .returns({ action: StreamAction.RESUME })
                .returns({}),
            },
            getRawState: sinon.stub().returns({}),
          };
          const runtimeClient = { createRuntime: sinon.stub().returns(runtime) };
          const input = {
            context: { versionID: 'version-id', runtimeClient },
            attributesManager: {
              getPersistentAttributes: sinon.stub().resolves({}),
              setPersistentAttributes: sinon.stub(),
            },
            requestEnvelope: { request: { type: `${Request.AUDIO_PLAYER}${AudioEvent.PlaybackNearlyFinished}` } },
            responseBuilder: { getResponse: sinon.stub().returns(output) },
          };

          expect(await handler.handle(input as any)).to.eql(output);
        });

        it('url but no token', async () => {
          const utils = { _streamMetaData: sinon.stub().returns({ url: '' }) };
          const handler = AudioPlayerEventHandlerGenerator(utils as any);
          const output = 'output';

          const runtime = {
            storage: {
              get: sinon
                .stub()
                .onFirstCall()
                .returns({ action: StreamAction.RESUME })
                .returns({}),
            },
            getRawState: sinon.stub().returns({}),
          };
          const runtimeClient = { createRuntime: sinon.stub().returns(runtime) };
          const input = {
            context: { versionID: 'version-id', runtimeClient },
            attributesManager: {
              getPersistentAttributes: sinon.stub().resolves({}),
              setPersistentAttributes: sinon.stub(),
            },
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
          const runtime = {
            storage: {
              produce: sinon.stub(),
              get: storageGet,
            },
            getRawState: sinon.stub().returns({}),
          };
          const runtimeClient = { createRuntime: sinon.stub().returns(runtime) };
          const input = {
            context: { versionID: 'version-id', runtimeClient },
            attributesManager: {
              getPersistentAttributes: sinon.stub().resolves({}),
              setPersistentAttributes: sinon.stub(),
            },
            requestEnvelope: { request: { type: `${Request.AUDIO_PLAYER}${AudioEvent.PlaybackNearlyFinished}` } },
            responseBuilder: { getResponse: sinon.stub().returns(output), addAudioPlayerPlayDirective: sinon.stub() },
          };

          expect(await handler.handle(input as any)).to.eql(output);
          expect(input.responseBuilder.addAudioPlayerPlayDirective.args).to.eql([
            [AudioDirective.ENQUEUE, metadata.url, metadata.token, 0, streamPlay.token, metadata.metaData],
          ]);

          const produceCallback = runtime.storage.produce.args[0][0];
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

          const runtime = { storage: { get: storageGet }, getRawState: sinon.stub().returns({}) };
          const tempRuntime = { storage: { get: sinon.stub().returns({ action: 'random' }), set: sinon.stub() } };
          const runtimeClient = {
            createRuntime: sinon
              .stub()
              .onFirstCall()
              .returns(runtime)
              .returns(tempRuntime),
          };
          const input = {
            context: { versionID: 'version-id', runtimeClient },
            attributesManager: {
              getPersistentAttributes: sinon.stub().resolves({}),
              setPersistentAttributes: sinon.stub(),
            },
            requestEnvelope: { request: { type: `${Request.AUDIO_PLAYER}${AudioEvent.PlaybackNearlyFinished}` } },
            responseBuilder: { getResponse: sinon.stub().returns(output) },
          };

          expect(await handler.handle(input as any)).to.eql(output);
          expect(runtimeClient.createRuntime.callCount).to.eql(2);
          expect(tempRuntime.storage.set.args).to.eql([[S.STREAM_PLAY, { action: StreamAction.NEXT }]]);
          expect(utils.update.callCount).to.eql(1);
        });

        it('no temp', async () => {
          const utils = { update: sinon.stub() };
          const handler = AudioPlayerEventHandlerGenerator(utils as any);
          const output = 'output';

          const storageGet = sinon.stub();
          storageGet.withArgs(S.STREAM_PLAY).returns({ action: StreamAction.START });
          storageGet.withArgs(S.STREAM_TEMP).returns(null);

          const runtime = { storage: { get: storageGet }, getRawState: sinon.stub().returns({}) };
          const tempRuntime = { storage: { get: sinon.stub().returns(null), set: sinon.stub() } };
          const runtimeClient = {
            createRuntime: sinon
              .stub()
              .onFirstCall()
              .returns(runtime)
              .returns(tempRuntime),
          };
          const input = {
            context: { versionID: 'version-id', runtimeClient },
            attributesManager: {
              getPersistentAttributes: sinon.stub().resolves({}),
              setPersistentAttributes: sinon.stub(),
            },
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

          const runtime = { storage: { get: storageGet, set: sinon.stub() }, getRawState: sinon.stub().returns({}) };
          const tempRuntimeRaw = 'temp-raw';
          const tempRuntime = {
            storage: { get: sinon.stub().returns({ action: StreamAction.START }), set: sinon.stub() },
            getRawState: sinon.stub().returns(tempRuntimeRaw),
          };
          const runtimeClient = {
            createRuntime: sinon
              .stub()
              .onFirstCall()
              .returns(runtime)
              .returns(tempRuntime),
          };
          const input = {
            context: { versionID: 'version-id', runtimeClient },
            attributesManager: {
              getPersistentAttributes: sinon.stub().resolves({}),
              setPersistentAttributes: sinon.stub(),
            },
            requestEnvelope: { request: { type: `${Request.AUDIO_PLAYER}${AudioEvent.PlaybackNearlyFinished}` } },
            responseBuilder: { getResponse: sinon.stub().returns(output) },
          };

          expect(await handler.handle(input as any)).to.eql(output);
          expect(runtime.storage.set.args).to.eql([[S.STREAM_TEMP, tempRuntimeRaw]]);
        });

        it('temp and url but no token', async () => {
          const utils = { update: sinon.stub(), _streamMetaData: sinon.stub().returns({ url: 'url' }) };
          const handler = AudioPlayerEventHandlerGenerator(utils as any);
          const output = 'output';

          const storageGet = sinon.stub();
          storageGet.withArgs(S.STREAM_PLAY).returns({ action: StreamAction.START });
          storageGet.withArgs(S.STREAM_TEMP).returns(null);

          const runtime = { storage: { get: storageGet, set: sinon.stub() }, getRawState: sinon.stub().returns({}) };
          const tempRuntimeRaw = 'temp-raw';
          const tempRuntime = {
            storage: { get: sinon.stub().returns({ action: StreamAction.START }), set: sinon.stub() },
            getRawState: sinon.stub().returns(tempRuntimeRaw),
          };
          const runtimeClient = {
            createRuntime: sinon
              .stub()
              .onFirstCall()
              .returns(runtime)
              .returns(tempRuntime),
          };
          const input = {
            context: { versionID: 'version-id', runtimeClient },
            attributesManager: {
              getPersistentAttributes: sinon.stub().resolves({}),
              setPersistentAttributes: sinon.stub(),
            },
            requestEnvelope: { request: { type: `${Request.AUDIO_PLAYER}${AudioEvent.PlaybackNearlyFinished}` } },
            responseBuilder: { getResponse: sinon.stub().returns(output) },
          };

          expect(await handler.handle(input as any)).to.eql(output);
          expect(runtime.storage.set.args).to.eql([[S.STREAM_TEMP, tempRuntimeRaw]]);
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

          const runtime = { storage: { get: storageGet, set: sinon.stub() }, getRawState: sinon.stub().returns({}) };
          const tempRuntimeRaw = 'temp-raw';
          const tempRuntime = {
            storage: {
              produce: sinon.stub(),
              get: sinon.stub().returns({ action: StreamAction.START }),
              set: sinon.stub(),
            },
            getRawState: sinon.stub().returns(tempRuntimeRaw),
          };
          const runtimeClient = {
            createRuntime: sinon
              .stub()
              .onFirstCall()
              .returns(runtime)
              .returns(tempRuntime),
          };
          const input = {
            context: { versionID: 'version-id', runtimeClient },
            attributesManager: {
              getPersistentAttributes: sinon.stub().resolves({}),
              setPersistentAttributes: sinon.stub(),
            },
            requestEnvelope: { request: { type: `${Request.AUDIO_PLAYER}${AudioEvent.PlaybackNearlyFinished}` } },
            responseBuilder: { addAudioPlayerPlayDirective: sinon.stub(), getResponse: sinon.stub().returns(output) },
          };

          expect(await handler.handle(input as any)).to.eql(output);
          expect(input.responseBuilder.addAudioPlayerPlayDirective.args).to.eql([
            [AudioDirective.ENQUEUE, metadata.url, metadata.token, 0, streamPlay.token, metadata.metaData],
          ]);

          const tempProduceCallback = tempRuntime.storage.produce.args[0][0];
          const draft = { [S.STREAM_PLAY]: { token: 'random' } };
          tempProduceCallback(draft);
          expect(draft[S.STREAM_PLAY].token).to.eql(metadata.token);
        });
      });
    });
  });
});
