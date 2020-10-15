import { expect } from 'chai';
import sinon from 'sinon';

import { S, T } from '@/lib/constants';
import {
  _streamMetaData,
  AudioDirective,
  StreamAction,
  StreamHandler,
  StreamResponseBuilder,
  StreamResponseBuilderGenerator,
} from '@/lib/services/voiceflow/handlers/stream';

describe('stream handler unit tests', () => {
  describe('canHandle', () => {
    it('false', () => {
      expect(StreamHandler(null as any).canHandle({} as any, null as any, null as any, null as any)).to.eql(false);
    });

    it('true', () => {
      expect(StreamHandler(null as any).canHandle({ play: {} } as any, null as any, null as any, null as any)).to.eql(true);
    });
  });

  describe('handle', () => {
    describe('no pause', () => {
      it('works', () => {
        const replaceVariables = sinon.stub();
        const audioUrl = 'audio-url';
        replaceVariables.onCall(0).returns(audioUrl);
        const title = 'title';
        replaceVariables.onCall(1).returns(title);
        const description = 'description';
        replaceVariables.onCall(2).returns(description);
        const icon_img = 'icon_img';
        replaceVariables.onCall(3).returns(icon_img);
        const background_img = 'background_img';
        replaceVariables.onCall(4).returns(background_img);

        const utils = { replaceVariables };
        const handler = StreamHandler(utils);

        const variablesMap = 'variables-map';
        const variables = { getState: sinon.stub().returns(variablesMap) };
        const context = { storage: { set: sinon.stub(), get: sinon.stub().returns(null) }, end: sinon.stub() };
        const node = {
          id: 'node-id',
          play: 'play',
          nextId: 'next-id',
          NEXT: 'NEXT',
          PAUSE_ID: 'PAUSE_ID',
          PREVIOUS: 'PREVIOUS',
          loop: false,
          icon_img: 'icon_im',
          background_img: 'background-img',
          description: 'description',
          title: 'title',
        };

        expect(handler.handle(node as any, context as any, variables as any, null as any)).to.eql(null);
        expect(variables.getState.callCount).to.eql(1);
        expect(utils.replaceVariables.args).to.eql([
          [node.play, variablesMap],
          [node.title, variablesMap],
          [node.description, variablesMap],
          [node.icon_img, variablesMap],
          [node.background_img, variablesMap],
        ]);
        expect(context.storage.set.args).to.eql([
          [
            S.STREAM_PLAY,
            {
              action: StreamAction.START,
              url: audioUrl,
              loop: node.loop,
              offset: 0,
              token: node.id,
              nextId: node.nextId,
              PAUSE_ID: node.PAUSE_ID,
              NEXT: node.NEXT,
              PREVIOUS: node.PREVIOUS,
              title,
              description,
              regex_title: node.title,
              regex_description: node.description,
              icon_img,
              background_img,
            },
          ],
        ]);
        expect(context.storage.get.args).to.eql([[S.STREAM_PAUSE]]);
        expect(context.end.callCount).to.eql(1);
      });
    });

    describe('with pause', () => {
      it('different pause ids', () => {
        const utils = { replaceVariables: sinon.stub().returns('') };
        const handler = StreamHandler(utils);

        const variables = { getState: sinon.stub().returns({}) };
        const streamPause = { id: 'random' };
        const context = {
          storage: {
            set: sinon.stub(),
            get: sinon.stub().returns(streamPause),
            delete: sinon.stub(),
          },
          end: sinon.stub(),
        };
        const node = { PAUSE_ID: 'PAUSE_ID' };

        expect(handler.handle(node as any, context as any, variables as any, null as any)).to.eql(null);
        expect(context.storage.delete.args).to.eql([[S.STREAM_PAUSE]]);
      });

      it('equal pause ids', () => {
        const utils = { replaceVariables: sinon.stub().returns('') };
        const handler = StreamHandler(utils);

        const variables = { getState: sinon.stub().returns({}) };
        const streamPause = { id: 'PAUSE_ID', offset: 100 };
        const context = {
          storage: {
            set: sinon.stub(),
            get: sinon.stub().returns(streamPause),
            delete: sinon.stub(),
            produce: sinon.stub(),
          },
          end: sinon.stub(),
        };
        const node = { PAUSE_ID: 'PAUSE_ID' };

        expect(handler.handle(node as any, context as any, variables as any, null as any)).to.eql(null);
        expect(context.storage.produce.callCount).to.eql(1);

        // assert produce callback
        const fn = context.storage.produce.args[0][0];
        const draft = {
          [S.STREAM_PLAY]: { offset: null, action: null },
        };
        fn(draft);
        expect(draft[S.STREAM_PLAY]).to.eql({ offset: streamPause.offset, action: StreamAction.PAUSE });
      });
    });
  });

  describe('_streamMetaData', () => {
    it('no stream play', () => {
      expect(_streamMetaData(null as any)).to.eql({});
    });

    it('stream play is empty', () => {
      expect(_streamMetaData({} as any)).to.eql({});
    });

    it('icon_img', () => {
      const streamPlay = { title: 'title', description: 'desc', icon_img: 'icon', url: 'url', offset: 100 };
      const result = _streamMetaData(streamPlay as any);
      expect(result.metaData).to.eql({
        title: streamPlay.title,
        subtitle: streamPlay.description,
        art: {
          sources: [
            {
              url: streamPlay.icon_img,
            },
          ],
        },
      });
      expect(result.url).to.eql(streamPlay.url);
      expect(result.offset).to.eql(streamPlay.offset);
      expect(typeof result.token).to.eq('string');
      expect(result.token?.length).to.not.eq(0);
    });

    it('background_img', () => {
      const streamPlay = { url: 'domain/random/title', description: 'desc', background_img: 'background' };
      const { metaData } = _streamMetaData(streamPlay as any);
      expect(metaData).to.eql({
        title: 'title',
        subtitle: streamPlay.description,
        backgroundImage: {
          sources: [
            {
              url: streamPlay.background_img,
            },
          ],
        },
      });
    });
  });

  describe('response builder', () => {
    it('no input and stream play', () => {
      const context = { storage: { get: sinon.stub().returns(null) }, turn: { get: sinon.stub().returns(null) } };
      StreamResponseBuilder(context as any, null as any);
      expect(context.turn.get.args).to.eql([[T.HANDLER_INPUT]]);
      expect(context.storage.get.args).to.eql([[S.STREAM_PLAY]]);
    });

    describe('input but no stream play', () => {
      it('no context', () => {
        const context = { storage: { get: sinon.stub().returns(null) }, turn: { get: sinon.stub().returns({ requestEnvelope: {} }) } };
        StreamResponseBuilder(context as any, null as any);
        expect(context.turn.get.args).to.eql([[T.HANDLER_INPUT]]);
        expect(context.storage.get.args).to.eql([[S.STREAM_PLAY]]);
      });

      it('no AudioPlayer', () => {
        const context = { storage: { get: sinon.stub().returns(null) }, turn: { get: sinon.stub().returns({ requestEnvelope: { context: {} } }) } };
        StreamResponseBuilder(context as any, null as any);
        expect(context.turn.get.args).to.eql([[T.HANDLER_INPUT]]);
        expect(context.storage.get.args).to.eql([[S.STREAM_PLAY]]);
      });
    });

    describe('input and stream play', () => {
      it('stream play action NOEFFECT', () => {
        const streamPlay = { action: StreamAction.NOEFFECT };
        const offsetInMilliseconds = 100;
        const input = { requestEnvelope: { context: { AudioPlayer: { offsetInMilliseconds } as { offsetInMilliseconds: number } | undefined } } };
        const context = { storage: { get: sinon.stub().returns(streamPlay), produce: sinon.stub() }, turn: { get: sinon.stub().returns(input) } };
        const builder = { withShouldEndSession: sinon.stub() };
        StreamResponseBuilder(context as any, builder as any);

        expect(builder.withShouldEndSession.args).to.eql([[true]]);

        // assert produce
        const fn = context.storage.produce.args[0][0];
        const draft = {
          [S.STREAM_PLAY]: { offset: 0 },
        };
        fn(draft);
        expect(draft[S.STREAM_PLAY].offset).to.eql(offsetInMilliseconds);

        // assert when no AudioPlayer
        delete input.requestEnvelope.context.AudioPlayer;

        fn(draft);
        expect(draft[S.STREAM_PLAY].offset).to.eql(undefined);
      });

      it('stream play action PAUSE', () => {
        const streamPlay = { action: StreamAction.PAUSE };
        const offsetInMilliseconds = 100;
        const input = { requestEnvelope: { context: { AudioPlayer: { offsetInMilliseconds } } } };
        const context = { storage: { get: sinon.stub().returns(streamPlay), produce: sinon.stub() }, turn: { get: sinon.stub().returns(input) } };
        const builder = { withShouldEndSession: sinon.stub(), addAudioPlayerStopDirective: sinon.stub() };
        StreamResponseBuilder(context as any, builder as any);

        expect(builder.addAudioPlayerStopDirective.callCount).to.eql(1);
      });

      it('stream play action END', () => {
        const streamPlay = { action: StreamAction.END };
        const offsetInMilliseconds = 100;
        const input = { requestEnvelope: { context: { AudioPlayer: { offsetInMilliseconds } } } };
        const context = {
          storage: { delete: sinon.stub(), get: sinon.stub().returns(streamPlay), produce: sinon.stub() },
          turn: { get: sinon.stub().returns(input) },
        };
        const builder = { withShouldEndSession: sinon.stub(), addAudioPlayerStopDirective: sinon.stub() };
        StreamResponseBuilder(context as any, builder as any);

        expect(context.storage.delete.args).to.eql([[S.STREAM_PAUSE], [S.STREAM_PLAY]]);
        expect(builder.addAudioPlayerStopDirective.callCount).to.eql(1);
      });

      describe('stream play action is resume or start', () => {
        it('no url', () => {
          const utils = { _streamMetaData: sinon.stub().returns({}) };
          const responseBuilder = StreamResponseBuilderGenerator(utils);
          const streamPlay = { action: StreamAction.START };
          const offsetInMilliseconds = 100;
          const input = { requestEnvelope: { context: { AudioPlayer: { offsetInMilliseconds } } } };
          const context = {
            storage: { get: sinon.stub().returns(streamPlay), produce: sinon.stub() },
            turn: { get: sinon.stub().returns(input) },
          };
          const builder = { withShouldEndSession: sinon.stub() };

          responseBuilder(context as any, builder as any);

          expect(utils._streamMetaData.args).to.eql([[streamPlay]]);
        });

        it('no token', () => {
          const utils = { _streamMetaData: sinon.stub().returns({ url: 'random' }) };
          const responseBuilder = StreamResponseBuilderGenerator(utils);
          const streamPlay = { action: StreamAction.START };
          const offsetInMilliseconds = 100;
          const input = { requestEnvelope: { context: { AudioPlayer: { offsetInMilliseconds } } } };
          const context = {
            storage: { get: sinon.stub().returns(streamPlay), produce: sinon.stub() },
            turn: { get: sinon.stub().returns(input) },
          };
          const builder = { withShouldEndSession: sinon.stub() };

          responseBuilder(context as any, builder as any);

          expect(utils._streamMetaData.args).to.eql([[streamPlay]]);
        });

        it('no offset', () => {
          const data = { url: 'url', token: 'token', metaData: 'metadata' };
          const utils = { _streamMetaData: sinon.stub().returns(data) };
          const responseBuilder = StreamResponseBuilderGenerator(utils);
          const streamPlay = { action: StreamAction.RESUME };
          const offsetInMilliseconds = 100;
          const input = { requestEnvelope: { context: { AudioPlayer: { offsetInMilliseconds } } } };
          const context = {
            storage: { get: sinon.stub().returns(streamPlay), produce: sinon.stub() },
            turn: { get: sinon.stub().returns(input) },
          };
          const builder = { withShouldEndSession: sinon.stub(), addAudioPlayerPlayDirective: sinon.stub() };

          responseBuilder(context as any, builder as any);

          expect(builder.addAudioPlayerPlayDirective.args).to.eql([[AudioDirective.REPLACE_ALL, data.url, data.token, 0, undefined, data.metaData]]);
          const fn = context.storage.produce.args[1][0];
          const draft = { [S.STREAM_PLAY]: { token: null } };
          fn(draft);
          expect(draft[S.STREAM_PLAY].token).to.eql(data.token);
        });

        it('with offset', () => {
          const data = { url: 'url', token: 'token', offset: 100, metaData: 'metadata' };
          const utils = { _streamMetaData: sinon.stub().returns(data) };
          const responseBuilder = StreamResponseBuilderGenerator(utils);
          const streamPlay = { action: StreamAction.RESUME };
          const offsetInMilliseconds = 100;
          const input = { requestEnvelope: { context: { AudioPlayer: { offsetInMilliseconds } } } };
          const context = {
            storage: { get: sinon.stub().returns(streamPlay), produce: sinon.stub() },
            turn: { get: sinon.stub().returns(input) },
          };
          const builder = { withShouldEndSession: sinon.stub(), addAudioPlayerPlayDirective: sinon.stub() };

          responseBuilder(context as any, builder as any);

          expect(builder.addAudioPlayerPlayDirective.args).to.eql([
            [AudioDirective.REPLACE_ALL, data.url, data.token, data.offset, undefined, data.metaData],
          ]);
        });
      });
    });
  });
});
