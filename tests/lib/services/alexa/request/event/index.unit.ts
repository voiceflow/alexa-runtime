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
        const utils = { getEvent: sinon.stub().returns('abc'), buildRuntime: sinon.stub().resolves('buildRuntime-val') };

        expect(await EventHandlerGenerator(utils as any).canHandle('input-val' as any)).to.eql(true);
        expect(utils.getEvent.args).to.eql([['buildRuntime-val']]);
        expect(utils.buildRuntime.args).to.eql([['input-val']]);
      });

      it('works with falsy getEvent return value', async () => {
        const utils = { getEvent: sinon.stub().returns(''), buildRuntime: sinon.stub().resolves('buildRuntime-val') };

        expect(await EventHandlerGenerator(utils as any).canHandle('input-val' as any)).to.eql(false);
        expect(utils.getEvent.args).to.eql([['buildRuntime-val']]);
        expect(utils.buildRuntime.args).to.eql([['input-val']]);
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
