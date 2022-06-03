import { expect } from 'chai';
import sinon from 'sinon';

import { EventHandlerGenerator } from '@/lib/services/alexa/request/event/index';
import * as runtimeModule from '@/lib/services/alexa/request/event/runtime';

describe('alexa request event unit tests', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('EventHandlerGenerator', () => {
    describe('canHandle', () => {
      it('works with truthy getEvent return value', async () => {
        const runtime = {
          stack: { getSize: sinon.stub().returns(1) },
          getRawState: sinon.stub().returns('getRawState-val'),
        };
        const input = { attributesManager: { setPersistentAttributes: sinon.stub() } };
        const utils = {
          getEvent: sinon.stub().returns('abc'),
          buildRuntime: sinon.stub().resolves(runtime),
          attributesManager: { setPersistentAttributes: sinon.stub() },
        };

        expect(await EventHandlerGenerator(utils as any).canHandle(input as any)).to.eql(true);
        expect(utils.getEvent.args).to.eql([[runtime]]);
        expect(utils.buildRuntime.args).to.eql([[input]]);
        expect(input.attributesManager.setPersistentAttributes.args).to.eql([['getRawState-val']]);
      });

      it('works with falsy getEvent return value', async () => {
        const runtime = { stack: { getSize: sinon.stub().returns(1) } };
        const input = { attributesManager: { setPersistentAttributes: sinon.stub() } };
        const utils = {
          getEvent: sinon.stub().returns(''),
          buildRuntime: sinon.stub().resolves(runtime),
          attributesManager: { setPersistentAttributes: sinon.stub() },
        };

        expect(await EventHandlerGenerator(utils as any).canHandle(input as any)).to.eql(false);
        expect(utils.getEvent.args).to.eql([[runtime]]);
        expect(utils.buildRuntime.args).to.eql([[input]]);
      });

      it('initialize and hydrates', async () => {
        const runtime = {
          stack: { getSize: sinon.stub().returns(0) },
          hydrateStack: sinon.stub(),
          getRawState: sinon.stub().returns('getRawState-val'),
        };
        const input = { attributesManager: { setPersistentAttributes: sinon.stub() } };
        const utils = {
          getEvent: sinon.stub().returns('abc'),
          buildRuntime: sinon.stub().resolves(runtime),
          initialize: sinon.stub(),
        };

        expect(await EventHandlerGenerator(utils as any).canHandle(input as any)).to.eql(true);
        expect(runtime.hydrateStack.callCount).to.eql(1);
        expect(utils.initialize.args).to.eql([[runtime, input]]);
        expect(utils.getEvent.args).to.eql([[runtime]]);
        expect(utils.buildRuntime.args).to.eql([[input]]);
        expect(input.attributesManager.setPersistentAttributes.args).to.eql([['getRawState-val']]);
      });
    });

    describe('handle', () => {
      it('works', async () => {
        const buildRuntimeReturn = { getRawState: sinon.stub().returns('getRawState-val') };
        const utils = {
          IntentHandler: { handle: sinon.stub().resolves('IntentHandlerHandle-val') },
          getEvent: sinon.stub().returns('abc'),
          buildRuntime: sinon.stub().resolves(buildRuntimeReturn),
        };
        const input = { attributesManager: { setPersistentAttributes: sinon.stub() } };
        const EventHandlerStub = sinon.stub(runtimeModule, 'default').resolves(true as any);

        expect(await EventHandlerGenerator(utils as any).handle(input as any)).to.eql('IntentHandlerHandle-val');
        expect(utils.buildRuntime.args).to.eql([[input]]);
        expect(EventHandlerStub.args).to.eql([[buildRuntimeReturn]]);
        expect(input.attributesManager.setPersistentAttributes.args).to.eql([['getRawState-val']]);
        expect(utils.IntentHandler.handle.args).to.eql([[input]]);
      });
    });
  });
});
