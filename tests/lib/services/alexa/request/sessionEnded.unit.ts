import { expect } from 'chai';
import sinon from 'sinon';

import { S } from '@/lib/constants';
import SessionEndedHandler, { ErrorType, Request, RequestReason, SessionEndedHandlerGenerator } from '@/lib/services/alexa/request/sessionEnded';

describe('session ended handler unit tests', () => {
  describe('canHandle', () => {
    it('false', () => {
      const input = { requestEnvelope: { request: { type: 'wrong-type' } } };
      expect(SessionEndedHandler.canHandle(input as any)).to.eql(false);
    });

    it('true', () => {
      const input = { requestEnvelope: { request: { type: Request.SESSION_ENDED } } };
      expect(SessionEndedHandler.canHandle(input as any)).to.eql(true);
    });
  });

  describe('handle', () => {
    describe('no errors', () => {
      it('no displayInfo', async () => {
        const utils = { updateRuntime: sinon.stub() };
        const handler = SessionEndedHandlerGenerator(utils as any);

        const output = 'output';
        const input = { responseBuilder: { getResponse: sinon.stub().returns(output) }, requestEnvelope: { request: {} } };

        expect(await handler.handle(input as any)).to.eql(output);
        expect(utils.updateRuntime.args[0][0]).to.eql(input);
        const fn = utils.updateRuntime.args[0][1];

        // assert updateRuntime callback
        const runtime = { storage: { get: sinon.stub().returns(null) } };
        fn(runtime);
        expect(runtime.storage.get.args).to.eql([[S.DISPLAY_INFO]]);
      });

      describe('with displayInfo', () => {
        it('no playingVideos', async () => {
          const utils = { updateRuntime: sinon.stub() };
          const handler = SessionEndedHandlerGenerator(utils as any);

          const output = 'output';
          const input = { responseBuilder: { getResponse: sinon.stub().returns(output) }, requestEnvelope: { request: {} } };

          expect(await handler.handle(input as any)).to.eql(output);
          expect(utils.updateRuntime.args[0][0]).to.eql(input);
          const fn = utils.updateRuntime.args[0][1];

          // assert updateRuntime callback
          const runtime = { storage: { get: sinon.stub().returns({ foo: 'bar' }) } };
          fn(runtime);
          expect(runtime.storage.get.args).to.eql([[S.DISPLAY_INFO]]);
        });

        it('with playingVideos', async () => {
          const utils = { updateRuntime: sinon.stub() };
          const handler = SessionEndedHandlerGenerator(utils as any);

          const output = 'output';
          const input = { responseBuilder: { getResponse: sinon.stub().returns(output) }, requestEnvelope: { request: {} } };

          expect(await handler.handle(input as any)).to.eql(output);
          expect(utils.updateRuntime.args[0][0]).to.eql(input);
          const fn = utils.updateRuntime.args[0][1];

          // assert updateRuntime callback
          const runtime = { storage: { get: sinon.stub().returns({ playingVideos: { foo: 'bar' } }), produce: sinon.stub() } };
          fn(runtime);
          expect(runtime.storage.get.args).to.eql([[S.DISPLAY_INFO]]);
          const fn2 = runtime.storage.produce.args[0][0];
          const state = { [S.DISPLAY_INFO]: { playingVideos: { foo: 'bar' } } };
          fn2(state);
          expect(state).to.eql({ [S.DISPLAY_INFO]: { playingVideos: {} } });
        });
      });
    });

    describe('with errors', () => {
      it('works correctly', async () => {
        const utils = { updateRuntime: sinon.stub(), log: { warn: sinon.stub() } };
        const handler = SessionEndedHandlerGenerator(utils as any);

        const output = 'output';
        const errorType = ErrorType.INTERNAL_SERVICE_ERROR;
        const input = {
          responseBuilder: { getResponse: sinon.stub().returns(output) },
          requestEnvelope: { request: { error: { type: errorType }, reason: RequestReason.ERROR } },
        };

        expect(await handler.handle(input as any)).to.eql(output);
        const fn = utils.updateRuntime.args[0][1];
        // assert updateRuntime callback
        const storageState = 'storage-state';
        const turnState = 'turn-state';
        const variablesState = 'variables-state';
        const stackState = 'stack-state';
        const traceState = 'trace-state';

        const runtime = {
          versionID: 'version-id',
          storage: { get: sinon.stub().returns(null), getState: sinon.stub().returns(storageState) },
          turn: { getState: sinon.stub().returns(turnState) },
          variables: { getState: sinon.stub().returns(variablesState) },
          stack: { getState: sinon.stub().returns(stackState) },
          trace: { get: sinon.stub().returns(traceState) },
        };

        fn(runtime);
        expect(utils.log.warn.args).to.eql([
          [
            'SESSION ENDED versionID=%s, error=%s, storage=%s, turn=%s, variables=%s, stack=%s, trace=%s',
            runtime.versionID,
            JSON.stringify(input.requestEnvelope.request.error),
            JSON.stringify(runtime.storage.getState()),
            JSON.stringify(runtime.turn.getState()),
            JSON.stringify(runtime.variables.getState()),
            JSON.stringify(runtime.stack.getState()),
            JSON.stringify(runtime.trace.get()),
          ],
        ]);
      });
    });
  });
});
