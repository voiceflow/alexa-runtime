import { expect } from 'chai';
import sinon from 'sinon';

import CanFulfillIntentHandler, { Request } from '@/lib/services/alexa/request/canFulfill';

describe('CanFulfillIntentHandler unit tests', () => {
  describe('canHandle', () => {
    it('false', () => {
      expect(CanFulfillIntentHandler.canHandle({ requestEnvelope: { request: { type: 'random' } } } as any)).to.eql(false);
    });

    it('true', () => {
      expect(CanFulfillIntentHandler.canHandle({ requestEnvelope: { request: { type: Request.CAN_FULFILL_INTENT } } } as any)).to.eql(true);
    });
  });

  describe('handle', () => {
    const getInput = (request: any, version: any) => ({
      requestEnvelope: {
        request,
      },
      responseBuilder: {
        withCanFulfillIntent: sinon.stub().returns({
          getResponse: sinon.stub(),
        }),
      },
      context: {
        api: {
          getVersion: sinon.stub().resolves(version),
        },
      },
    });

    it('can fulfill', async () => {
      const version = {
        prototype: {
          model: {
            intents: [
              {
                name: 'name',
                slots: [
                  {
                    id: '1',
                  },
                ],
              },
            ],
            slots: [
              {
                key: '1',
                name: 'slot1',
              },
            ],
          },
        },
      };

      const request = {
        intent: {
          name: 'name',
          slots: {
            slot1: {},
          },
        },
      };

      const input = getInput(request, version);

      const expectedResponse = {
        canFulfill: 'YES',
        slots: {
          slot1: {
            canUnderstand: 'YES',
            canFulfill: 'YES',
          },
        },
      };

      await CanFulfillIntentHandler.handle(input as any);

      expect(input.responseBuilder.withCanFulfillIntent.args[0]).to.eql([expectedResponse]);
    });

    it('cannot fulfill', async () => {
      const version = {
        prototype: {
          model: {
            intents: [],
            slots: [],
          },
        },
      };

      const request = {
        intent: {
          name: 'name',
          slots: {
            slot1: {},
          },
        },
      };

      const input = getInput(request, version);

      const expectedResponse = {
        canFulfill: 'NO',
        slots: {
          slot1: {
            canUnderstand: 'NO',
            canFulfill: 'NO',
          },
        },
      };

      await CanFulfillIntentHandler.handle(input as any);

      expect(input.responseBuilder.withCanFulfillIntent.args[0]).to.eql([expectedResponse]);
    });
  });
});
