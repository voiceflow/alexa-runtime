import { expect } from 'chai';
import sinon from 'sinon';

import { S } from '@/lib/constants';
import EventHandler, { EventHandlerGenerator, Request } from '@/lib/services/alexa/request/event';

describe('event handler unit test', () => {
  describe('canHandle', () => {
    it('false', () => {
      const input = { requestEnvelope: { request: { type: 'random-type' } } };
      expect(EventHandler.canHandle(input as any)).to.eql(false);
    });

    it('true', () => {
      const input = { requestEnvelope: { request: { type: `${Request.EVENT_ROOT}Skill` } } };
      expect(EventHandler.canHandle(input as any)).to.eql(true);
    });
  });

  describe('handle', () => {
    describe('does not enter if', () => {
      it('wrong type', async () => {
        const output = 'output';
        const input = { requestEnvelope: { request: { type: 'random-type' } }, responseBuilder: { getResponse: sinon.stub().returns(output) } };
        expect(await EventHandler.handle(input as any)).to.eql(output);
      });

      it('no request body', async () => {
        const output = 'output';
        const input = { requestEnvelope: { request: { type: Request.ACCEPTED } }, responseBuilder: { getResponse: sinon.stub().returns(output) } };
        expect(await EventHandler.handle(input as any)).to.eql(output);
      });

      it('accepted permissions is not array', async () => {
        const output = 'output';
        const input = {
          requestEnvelope: { request: { type: Request.ACCEPTED, body: { acceptedPermissions: null } } },
          responseBuilder: { getResponse: sinon.stub().returns(output) },
        };
        expect(await EventHandler.handle(input as any)).to.eql(output);
      });
    });

    describe('enters if', () => {
      it('works correctly', async () => {
        const utils = {
          updateContext: sinon.stub(),
        };

        const handler = EventHandlerGenerator(utils);

        const output = 'output';
        const permissions = [{ scope: 'p1' }, { scope: 'p2' }, {}, { scope: 'p3' }];
        const input = {
          requestEnvelope: { request: { type: Request.ACCEPTED, body: { acceptedPermissions: permissions } } },
          responseBuilder: { getResponse: sinon.stub().returns(output) },
        };
        expect(await handler.handle(input as any)).to.eql(output);
        expect(utils.updateContext.args[0][0]).to.eql(input);

        // assert callback
        const fn = utils.updateContext.args[0][1];

        const context = { storage: { set: sinon.stub() } };
        fn(context);

        expect(context.storage.set.args).to.eql([[S.PERMISSIONS, ['p1', 'p2', 'p3']]]);
      });
    });
  });
});
