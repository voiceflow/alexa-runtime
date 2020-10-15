import { expect } from 'chai';
import sinon from 'sinon';

import { S, T } from '@/lib/constants';
import DefaultStreamStateHandler, { StreamFailPhrase, StreamStateHandler } from '@/lib/services/voiceflow/handlers/state/stream';
import { StreamAction } from '@/lib/services/voiceflow/handlers/stream';
import { IntentName } from '@/lib/services/voiceflow/types';

describe('stream state handler unit tests', () => {
  const streamStateHandler = DefaultStreamStateHandler();

  describe('canHandle', () => {
    it('false', () => {
      expect(streamStateHandler.canHandle(null as any, { storage: { get: sinon.stub().returns(null) } } as any, null as any, null as any)).to.eql(
        false
      );
      expect(
        streamStateHandler.canHandle(
          null as any,
          { storage: { get: sinon.stub().returns({ action: StreamAction.END }) } } as any,
          null as any,
          null as any
        )
      ).to.eql(false);
    });

    it('true', () => {
      expect(
        streamStateHandler.canHandle(
          null as any,
          { storage: { get: sinon.stub().returns({ action: StreamAction.START }) } } as any,
          null as any,
          null as any
        )
      ).to.eql(true);
    });
  });

  describe('handle', () => {
    describe('no intent name', () => {
      it('command cant handle', () => {
        const request = null;
        const otherLocale = 'it-IT';
        const updatedStreamPlay = {
          regex_title: '{titleVar}',
          regex_description: 'description',
        };
        const variablesMap = {
          titleVar: 'the var title',
        };
        const storageGet = sinon
          .stub()
          .onFirstCall()
          .returns({ action: 'random' })
          .onSecondCall()
          .returns(updatedStreamPlay)
          .onThirdCall()
          .returns(null)
          .onCall(3)
          .returns(otherLocale);

        const context = {
          storage: { produce: sinon.stub(), get: storageGet },
          end: sinon.stub(),
          turn: { get: sinon.stub().returns(request), delete: sinon.stub() },
        };
        const variables = { getState: sinon.stub().returns(variablesMap) };
        expect(streamStateHandler.handle(null as any, context as any, variables as any, null as any)).to.eql(null);
        expect(context.turn.get.args[0]).to.eql([T.REQUEST]);
        expect(storageGet.args).to.eql([[S.STREAM_PLAY], [S.STREAM_PLAY]]);
        expect(context.turn.delete.args).to.eql([[T.REQUEST]]);
        expect(context.end.callCount).to.eql(1);

        const fn1 = context.storage.produce.args[0][0];
        const draft1 = { [S.STREAM_PLAY]: { action: 'random' } };
        fn1(draft1);
        expect(draft1[S.STREAM_PLAY]).to.eql({ action: StreamAction.NOEFFECT });

        const fn2 = context.storage.produce.args[1][0];
        const draft2 = { output: 'old' };
        fn2(draft2);
        expect(draft2.output).to.eql(`old${StreamFailPhrase['en-US']}`);
        const draft3 = { output: 'other old' };
        fn2(draft3);
        expect(draft3.output).to.eql(`other old${StreamFailPhrase[otherLocale]}`);

        const fn3 = context.storage.produce.args[2][0];
        const draft4 = { [S.STREAM_PLAY]: { title: 'old title', description: 'old desc' } };
        fn3(draft4);
        expect(draft4[S.STREAM_PLAY]).to.eql({ title: variablesMap.titleVar, description: updatedStreamPlay.regex_description });
        expect(context.end.callCount).to.eql(1);
      });

      it('command can handle', () => {
        const output = 'output';
        const utils = {
          commandHandler: {
            canHandle: sinon.stub().returns(true),
            handle: sinon.stub().returns(output),
          },
        };
        const handler = StreamStateHandler(utils as any);

        const request = null;
        const context = {
          storage: { produce: sinon.stub(), get: sinon.stub().returns({ action: 'random' }) },
          turn: { get: sinon.stub().returns(request), delete: sinon.stub() },
        };
        expect(handler.handle(null as any, context as any, null as any, null as any)).to.eql(output);

        const fn = context.storage.produce.args[0][0];
        const draft = { [S.STREAM_PLAY]: { action: 'random' } };
        fn(draft);
        expect(draft[S.STREAM_PLAY]).to.eql({ action: StreamAction.END });
      });

      it('no request payload', () => {
        const request = {};
        const context = {
          storage: {
            produce: sinon.stub(),
            get: sinon
              .stub()
              .onFirstCall()
              .returns({ action: 'random' })
              .returns(null),
          },
          end: sinon.stub(),
          turn: { get: sinon.stub().returns(request), delete: sinon.stub() },
        };
        expect(streamStateHandler.handle(null as any, context as any, null as any, null as any)).to.eql(null);
      });

      it('no request payload intent', () => {
        const request = { payload: {} };
        const context = {
          storage: {
            produce: sinon.stub(),
            get: sinon
              .stub()
              .onFirstCall()
              .returns({ action: 'random' })
              .returns(null),
          },
          end: sinon.stub(),
          turn: { get: sinon.stub().returns(request), delete: sinon.stub() },
        };
        expect(streamStateHandler.handle(null as any, context as any, null as any, null as any)).to.eql(null);
      });
    });

    it('IntentName.CANCEL', () => {
      const request = { payload: { intent: { name: IntentName.CANCEL } } };
      const context = {
        storage: {
          produce: sinon.stub(),
          get: sinon
            .stub()
            .onFirstCall()
            .returns({ action: 'random' })
            .returns(null),
        },
        end: sinon.stub(),
        turn: { get: sinon.stub().returns(request), delete: sinon.stub() },
      };
      expect(streamStateHandler.handle(null as any, context as any, null as any, null as any)).to.eql(null);

      const fn = context.storage.produce.args[0][0];
      const draft = { [S.STREAM_PLAY]: { action: 'random' } };
      fn(draft);
      expect(draft[S.STREAM_PLAY]).to.eql({ action: StreamAction.PAUSE });
      expect(context.end.callCount).to.eql(1);
    });

    it('IntentName.RESUME', () => {
      const request = { payload: { intent: { name: IntentName.RESUME } } };
      const context = {
        storage: {
          produce: sinon.stub(),
          get: sinon
            .stub()
            .onFirstCall()
            .returns({ action: 'random' })
            .returns(null),
        },
        end: sinon.stub(),
        turn: { get: sinon.stub().returns(request), delete: sinon.stub() },
      };
      expect(streamStateHandler.handle(null as any, context as any, null as any, null as any)).to.eql(null);

      const fn = context.storage.produce.args[0][0];
      const draft = { [S.STREAM_PLAY]: { action: 'random' } };
      fn(draft);
      expect(draft[S.STREAM_PLAY]).to.eql({ action: StreamAction.RESUME });
      expect(context.end.callCount).to.eql(1);
    });

    it('IntentName.STARTOVER', () => {
      const request = { payload: { intent: { name: IntentName.STARTOVER } } };
      const context = {
        storage: {
          produce: sinon.stub(),
          get: sinon
            .stub()
            .onFirstCall()
            .returns({ action: 'random' })
            .returns(null),
        },
        end: sinon.stub(),
        turn: { get: sinon.stub().returns(request), delete: sinon.stub() },
      };
      expect(streamStateHandler.handle(null as any, context as any, null as any, null as any)).to.eql(null);

      const fn = context.storage.produce.args[0][0];
      const draft = { [S.STREAM_PLAY]: { action: 'random', offset: null } };
      fn(draft);
      expect(draft[S.STREAM_PLAY]).to.eql({ action: StreamAction.START, offset: 0 });
      expect(context.end.callCount).to.eql(1);
    });

    describe('IntentName.NEXT', () => {
      it('with NEXT', () => {
        const request = { payload: { intent: { name: IntentName.NEXT } } };
        const NEXT = 'next-id';
        const context = {
          storage: {
            produce: sinon.stub(),
            get: sinon
              .stub()
              .onFirstCall()
              .returns({ action: 'random', NEXT })
              .returns(null),
            delete: sinon.stub(),
          },
          turn: { get: sinon.stub().returns(request), delete: sinon.stub() },
        };
        expect(streamStateHandler.handle(null as any, context as any, null as any, null as any)).to.eql(NEXT);
        expect(context.storage.delete.args).to.eql([[S.STREAM_TEMP]]);

        const fn = context.storage.produce.args[0][0];
        const draft = { [S.STREAM_PLAY]: { action: 'random' } };
        fn(draft);
        expect(draft[S.STREAM_PLAY]).to.eql({ action: StreamAction.END });
      });

      it('without NEXT', () => {
        const request = { payload: { intent: { name: IntentName.NEXT } } };
        const context = {
          storage: {
            produce: sinon.stub(),
            get: sinon
              .stub()
              .onFirstCall()
              .returns({ action: 'random' })
              .returns(null),
            delete: sinon.stub(),
          },
          turn: { get: sinon.stub().returns(request), delete: sinon.stub() },
        };
        expect(streamStateHandler.handle(null as any, context as any, null as any, null as any)).to.eql(null);
        expect(context.storage.delete.args).to.eql([[S.STREAM_TEMP]]);

        const fn = context.storage.produce.args[0][0];
        const draft = { [S.STREAM_PLAY]: { action: 'random' } };
        fn(draft);
        expect(draft[S.STREAM_PLAY]).to.eql({ action: StreamAction.END });
      });
    });

    describe('IntentName.PREV', () => {
      it('with PREVIOUS', () => {
        const request = { payload: { intent: { name: IntentName.PREV } } };
        const PREVIOUS = 'previous-id';
        const context = {
          storage: {
            produce: sinon.stub(),
            get: sinon
              .stub()
              .onFirstCall()
              .returns({ action: 'random', PREVIOUS })
              .returns(null),
            delete: sinon.stub(),
          },
          turn: { get: sinon.stub().returns(request), delete: sinon.stub() },
        };
        expect(streamStateHandler.handle(null as any, context as any, null as any, null as any)).to.eql(PREVIOUS);
        expect(context.storage.delete.args).to.eql([[S.STREAM_TEMP]]);

        const fn = context.storage.produce.args[0][0];
        const draft = { [S.STREAM_PLAY]: { action: 'random' } };
        fn(draft);
        expect(draft[S.STREAM_PLAY]).to.eql({ action: StreamAction.END });
      });

      it('without PREVIOUS', () => {
        const request = { payload: { intent: { name: IntentName.PREV } } };
        const context = {
          storage: {
            produce: sinon.stub(),
            get: sinon
              .stub()
              .onFirstCall()
              .returns({ action: 'random' })
              .returns(null),
            delete: sinon.stub(),
          },
          turn: { get: sinon.stub().returns(request), delete: sinon.stub() },
        };
        expect(streamStateHandler.handle(null as any, context as any, null as any, null as any)).to.eql(null);
        expect(context.storage.delete.args).to.eql([[S.STREAM_TEMP]]);

        const fn = context.storage.produce.args[0][0];
        const draft = { [S.STREAM_PLAY]: { action: 'random' } };
        fn(draft);
        expect(draft[S.STREAM_PLAY]).to.eql({ action: StreamAction.END });
      });
    });

    describe('IntentName.PAUSE', () => {
      it('with nextId', () => {
        const request = { payload: { intent: { name: IntentName.PAUSE } } };
        const streamPlay = {
          action: 'random',
          nextId: 'next-id',
          PAUSE_ID: 'pause-id',
          offset: 5,
        };
        const context = {
          storage: {
            produce: sinon.stub(),
            get: sinon
              .stub()
              .onFirstCall()
              .returns(streamPlay)
              .returns(null),
            set: sinon.stub(),
          },
          turn: { get: sinon.stub().returns(request), delete: sinon.stub() },
        };
        expect(streamStateHandler.handle(null as any, context as any, null as any, null as any)).to.eql(streamPlay.nextId);
        expect(context.storage.set.args).to.eql([
          [
            S.STREAM_PAUSE,
            {
              id: streamPlay.PAUSE_ID,
              offset: streamPlay.offset,
            },
          ],
        ]);

        const fn = context.storage.produce.args[0][0];
        const draft = { [S.STREAM_PLAY]: { action: 'random' } };
        fn(draft);
        expect(draft[S.STREAM_PLAY]).to.eql({ action: StreamAction.END });
      });

      it('without nextId', () => {
        const request = { payload: { intent: { name: IntentName.PAUSE } } };
        const context = {
          storage: {
            produce: sinon.stub(),
            get: sinon
              .stub()
              .onFirstCall()
              .returns({ action: 'random' })
              .returns(null),
            delete: sinon.stub(),
          },
          turn: { get: sinon.stub().returns(request), delete: sinon.stub() },
          end: sinon.stub(),
        };
        expect(streamStateHandler.handle(null as any, context as any, null as any, null as any)).to.eql(null);
        expect(context.end.callCount).to.eql(1);

        const fn = context.storage.produce.args[0][0];
        const draft = { [S.STREAM_PLAY]: { action: 'random' } };
        fn(draft);
        expect(draft[S.STREAM_PLAY]).to.eql({ action: StreamAction.PAUSE });
      });
    });
  });
});
