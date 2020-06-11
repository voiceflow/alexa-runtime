import { expect } from 'chai';
import sinon from 'sinon';

import { S } from '@/lib/constants';
import APLUserEventHandler, { APLUserEventHandlerGenerator, SourceHandler } from '@/lib/services/alexa/request/aplUserEvent';
import { Request } from '@/lib/services/alexa/types';
import { updateContext } from '@/lib/services/alexa/utils';
import { DOCUMENT_VIDEO_TYPE, ENDED_EVENT_PREFIX } from '@/lib/services/voiceflow/handlers/display/constants';

describe('APL User Event Handler unit tests', () => {
  describe('canHandle', () => {
    it('false', () => {
      expect(APLUserEventHandler.canHandle({ requestEnvelope: { request: { type: 'random' } } } as any)).to.eql(false);
    });

    it('true', () => {
      expect(APLUserEventHandler.canHandle({ requestEnvelope: { request: { type: Request.APL_USER_EVENT } } } as any)).to.eql(true);
    });
  });

  describe('handle', () => {
    it('hasDisplayInfo false', async () => {
      const utils = { updateContext: sinon.stub() };
      const handler = APLUserEventHandlerGenerator(utils as any);

      const output = 'output';
      const input = {
        requestEnvelope: { request: {} },
        responseBuilder: { getResponse: sinon.stub().returns(output) },
      };
      expect(await handler.handle(input as any)).to.eql(output);
      expect(utils.updateContext.args[0][0]).to.eql(input);

      const updateContextCallback = utils.updateContext.args[0][1];
      const context = { storage: { produce: sinon.stub() } };
      updateContextCallback(context);
      expect(context.storage.produce.callCount).to.eql(1);
    });

    describe('produce callback', () => {
      it('end handler', async () => {
        const utils = { updateContext: sinon.stub() };
        const handler = APLUserEventHandlerGenerator(utils as any);

        const output = 'output';
        const sourceId = 'id';
        const input = {
          requestEnvelope: { request: { source: { handler: SourceHandler.END, type: DOCUMENT_VIDEO_TYPE, id: sourceId } } },
          responseBuilder: { getResponse: sinon.stub().returns(output) },
        };
        expect(await handler.handle(input as any)).to.eql(output);
        expect(utils.updateContext.args[0][0]).to.eql(input);

        const updateContextCallback = utils.updateContext.args[0][1];
        const context = { storage: { produce: sinon.stub() } };
        updateContextCallback(context);
        expect(context.storage.produce.callCount).to.eql(1);

        const produceCallback = context.storage.produce.args[0][0];

        const state = { [S.DISPLAY_INFO]: { playingVideos: { id: 1, foo: 'bar' } } };
        produceCallback(state);
        expect(state[S.DISPLAY_INFO]).to.eql({ playingVideos: { foo: 'bar' } });

        const state2 = {};
        produceCallback(state2);
        expect(state2).to.eql({});
      });

      it('play handler', async () => {
        const clock = sinon.useFakeTimers(Date.now()); // fake Date.now

        const utils = { updateContext: sinon.stub() };
        const handler = APLUserEventHandlerGenerator(utils as any);

        const output = 'output';
        const sourceId = 'id';
        const input = {
          requestEnvelope: { request: { source: { handler: SourceHandler.PLAY, type: DOCUMENT_VIDEO_TYPE, id: sourceId } } },
          responseBuilder: { getResponse: sinon.stub().returns(output) },
        };
        expect(await handler.handle(input as any)).to.eql(output);
        expect(utils.updateContext.args[0][0]).to.eql(input);

        const updateContextCallback = utils.updateContext.args[0][1];
        const context = { storage: { produce: sinon.stub() } };
        updateContextCallback(context);
        expect(context.storage.produce.callCount).to.eql(1);

        const produceCallback = context.storage.produce.args[0][0];

        const state = {};
        produceCallback(state);
        expect(state).to.eql({
          displayInfo: {
            playingVideos: {
              [sourceId]: {
                started: clock.now,
              },
            },
          },
        });

        const state2 = { [S.DISPLAY_INFO]: { playingVideos: { foo: 'bar' } } };
        produceCallback(state2);
        expect(state2).to.eql({
          displayInfo: {
            playingVideos: {
              [sourceId]: {
                started: clock.now,
              },
              foo: 'bar',
            },
          },
        });

        clock.restore(); // restore Date.now
      });

      it('no source', async () => {
        const utils = { updateContext: sinon.stub() };
        const handler = APLUserEventHandlerGenerator(utils as any);

        const output = 'output';
        const input = {
          requestEnvelope: { request: {} },
          responseBuilder: { getResponse: sinon.stub().returns(output) },
        };
        expect(await handler.handle(input as any)).to.eql(output);

        const updateContextCallback = utils.updateContext.args[0][1];
        const context = { storage: { produce: sinon.stub() } };
        updateContextCallback(context);
        expect(context.storage.produce.callCount).to.eql(1);

        const produceCallback = context.storage.produce.args[0][0];

        const state = {};
        produceCallback(state);
        expect(state).to.eql({});
      });
    });

    describe('hasDisplayInfo true', () => {
      it('intent handler handles', async () => {
        const output = 'output';
        const utils = { updateContext, IntentHandler: { handle: sinon.stub().returns(output) } };
        const handler = APLUserEventHandlerGenerator(utils as any);

        const state = { [S.DISPLAY_INFO]: {} };
        const context = {
          getRawState: sinon.stub().returns({}),
          storage: {
            produce: (fn: any) => {
              fn(state);
            },
          },
        };

        const input = {
          requestEnvelope: { request: { source: {}, arguments: [ENDED_EVENT_PREFIX] } },
          context: {
            versionID: 'version-id',
            voiceflow: { createContext: sinon.stub().returns(context) },
          },
          attributesManager: {
            getPersistentAttributes: sinon.stub().returns({}),
            setPersistentAttributes: sinon.stub(),
          },
        };
        expect(await handler.handle(input as any)).to.eql(output);
      });

      it('no arguments', async () => {
        const output = 'output';
        const utils = { updateContext };
        const handler = APLUserEventHandlerGenerator(utils as any);

        const state = { [S.DISPLAY_INFO]: {} };
        const context = {
          getRawState: sinon.stub().returns({}),
          storage: {
            produce: (fn: any) => {
              fn(state);
            },
          },
        };

        const input = {
          responseBuilder: { getResponse: sinon.stub().returns(output) },
          requestEnvelope: { request: { source: {} } },
          context: {
            versionID: 'version-id',
            voiceflow: { createContext: sinon.stub().returns(context) },
          },
          attributesManager: {
            getPersistentAttributes: sinon.stub().returns({}),
            setPersistentAttributes: sinon.stub(),
          },
        };
        expect(await handler.handle(input as any)).to.eql(output);
      });

      it('no ENDED_EVENT_PREFIX in  arguments', async () => {
        const output = 'output';
        const utils = { updateContext };
        const handler = APLUserEventHandlerGenerator(utils as any);

        const state = { [S.DISPLAY_INFO]: {} };
        const context = {
          getRawState: sinon.stub().returns({}),
          storage: {
            produce: (fn: any) => {
              fn(state);
            },
          },
        };

        const input = {
          responseBuilder: { getResponse: sinon.stub().returns(output) },
          requestEnvelope: { request: { source: {}, arguments: [] } },
          context: {
            versionID: 'version-id',
            voiceflow: { createContext: sinon.stub().returns(context) },
          },
          attributesManager: {
            getPersistentAttributes: sinon.stub().returns({}),
            setPersistentAttributes: sinon.stub(),
          },
        };
        expect(await handler.handle(input as any)).to.eql(output);
      });
    });
  });
});
