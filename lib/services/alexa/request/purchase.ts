import { HandlerInput, RequestHandler } from 'ask-sdk';
import { interfaces } from 'ask-sdk-model';

import { S } from '@/lib/constants';
import { PaymentStorage } from '@/lib/services/voiceflow/handlers/payment';

import { updateContext } from '../utils';
import IntentHandler from './intent';

export enum Request {
  RESPONSE_TYPE = 'Connections.Response',
  REQ_NAME = 'Buy',
}

const utilsObj = {
  IntentHandler,
  updateContext,
};

export const PurchaseHandlerGenerator = (utils: typeof utilsObj): RequestHandler => ({
  canHandle(input: HandlerInput): boolean {
    const { request } = input.requestEnvelope;

    return request.type === Request.RESPONSE_TYPE && request.name === Request.REQ_NAME;
  },
  async handle(input: HandlerInput) {
    const { payload, status } = input.requestEnvelope.request as interfaces.connections.ConnectionsResponse;
    const result: false | undefined | interfaces.monetization.v1.PurchaseResult = +(status?.code || 0) < 300 && payload?.purchaseResult;

    await utils.updateContext(input, (context) => {
      context.storage.produce<{ [S.PAYMENT]: PaymentStorage }>((draft) => {
        if (draft[S.PAYMENT]) {
          draft[S.PAYMENT].status = result || false;
        }
      });
    });

    return utils.IntentHandler.handle(input);
  },
});

export default PurchaseHandlerGenerator(utilsObj);
