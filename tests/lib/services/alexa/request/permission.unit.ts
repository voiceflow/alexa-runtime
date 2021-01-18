import { expect } from 'chai';
import sinon from 'sinon';

import { S } from '@/lib/constants';
import PermissionHandler, { PermissionHandlerGenerator } from '@/lib/services/alexa/request/permission';
import { Request } from '@/lib/services/alexa/types';

describe('permission handler unit test', () => {
  describe('canHandle', () => {
    it('false', () => {
      const input = { requestEnvelope: { request: { type: 'random-type' } } };
      expect(PermissionHandler.canHandle(input as any)).to.eql(false);
    });

    it('true', () => {
      const input = { requestEnvelope: { request: { type: `${Request.SKILL_EVENT_ROOT}Skill` } } };
      expect(PermissionHandler.canHandle(input as any)).to.eql(true);
    });
  });

  describe('handle', () => {
    describe('does not enter if', () => {
      it('wrong type', async () => {
        const output = 'output';
        const input = { requestEnvelope: { request: { type: 'random-type' } }, responseBuilder: { getResponse: sinon.stub().returns(output) } };
        expect(await PermissionHandler.handle(input as any)).to.eql(output);
      });

      it('no request body', async () => {
        const output = 'output';
        const input = {
          requestEnvelope: { request: { type: Request.PERMISSION_ACCEPTED } },
          responseBuilder: { getResponse: sinon.stub().returns(output) },
        };
        expect(await PermissionHandler.handle(input as any)).to.eql(output);
      });

      it('accepted permissions is not array', async () => {
        const output = 'output';
        const input = {
          requestEnvelope: { request: { type: Request.PERMISSION_ACCEPTED, body: { acceptedPermissions: null } } },
          responseBuilder: { getResponse: sinon.stub().returns(output) },
        };
        expect(await PermissionHandler.handle(input as any)).to.eql(output);
      });
    });

    describe('enters if', () => {
      it('works correctly', async () => {
        const utils = {
          updateRuntime: sinon.stub(),
        };

        const handler = PermissionHandlerGenerator(utils);

        const output = 'output';
        const permissions = [{ scope: 'p1' }, { scope: 'p2' }, {}, { scope: 'p3' }];
        const input = {
          requestEnvelope: { request: { type: Request.PERMISSION_ACCEPTED, body: { acceptedPermissions: permissions } } },
          responseBuilder: { getResponse: sinon.stub().returns(output) },
        };
        expect(await handler.handle(input as any)).to.eql(output);
        expect(utils.updateRuntime.args[0][0]).to.eql(input);

        // assert callback
        const fn = utils.updateRuntime.args[0][1];

        const context = { storage: { set: sinon.stub() } };
        fn(context);

        expect(context.storage.set.args).to.eql([[S.PERMISSIONS, ['p1', 'p2', 'p3']]]);
      });
    });
  });
});
