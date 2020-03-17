/* eslint-disable max-nested-callbacks */
import { ResponseBuilder } from '@voiceflow/backend-utils';
import VError from '@voiceflow/verror';
import { expect } from 'chai';
import sinon from 'sinon';

import Alexa from '@/lib/controllers/alexa';

describe('alexa controller unit tests', () => {
  describe('handler', () => {
    it('works correctly', async () => {
      const output = 'output';

      const client = { foo: 'bar' };
      const services = {
        alexa: { invoke: sinon.stub().resolves(output) },
        voiceflow: { client: sinon.stub().returns(client) },
      };

      const alexaController = new Alexa(services as any, null as any);

      const req = { body: { var1: 'val1' }, params: { versionID: 'version-id' } };
      expect(await alexaController.handler(req as any)).to.eql(output);
      expect(services.alexa.invoke.args).to.eql([[req.body, { versionID: req.params.versionID, voiceflow: client }]]);
    });
  });

  describe('validations', () => {
    describe('params', () => {
      describe('VERSION_ID', () => {
        it('fails', async () => {
          const validation = Alexa.VALIDATIONS.PARAMS.versionID;
          const req = {
            params: {},
          };
          const next = sinon.stub();
          await validation(req, null, next);
          expect(() => new ResponseBuilder().validationResult(req))
            .to.throw(VError)
            .to.deep.nested.include({
              'data.errors': {
                versionID: {
                  message: 'Invalid value',
                },
              },
            });
        });
        it('passes', async () => {
          const validation = Alexa.VALIDATIONS.PARAMS.versionID;
          const req = {
            params: {
              versionID: 'some-random-version-id',
            },
          };
          const next = sinon.stub();
          await validation(req, null, next);
          new ResponseBuilder().validationResult(req, null as any, next);
          expect(next.callCount).to.eql(2);
        });
      });
    });
  });
});
