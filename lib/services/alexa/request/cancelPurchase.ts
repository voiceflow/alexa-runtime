import { RequestHandler } from 'ask-sdk';
import { interfaces } from 'ask-sdk-model';

import { S } from '@/lib/constants';
import { CancelPaymentStorage } from '@/lib/services/runtime/handlers/cancelPayment';

import { AlexaHandlerInput } from '../types';
import { updateRuntime } from '../utils';
import IntentHandler from './intent';

export enum Request {
  REQ_NAME = 'Cancel',
  RESPONSE_TYPE = 'Connections.Response',
}

const utilsObj = {
  updateRuntime,
  IntentHandler,
};

export const CancelPurchaseHandlerGenerator = (utils: typeof utilsObj): RequestHandler => ({
  canHandle(input: AlexaHandlerInput): boolean {
    const { request } = input.requestEnvelope;

    return request.type === Request.RESPONSE_TYPE && request.name === Request.REQ_NAME;
  },
  async handle(input: AlexaHandlerInput) {
    const { payload } = input.requestEnvelope.request as interfaces.connections.ConnectionsResponse;
    const result: false | interfaces.monetization.v1.PurchaseResult = payload?.purchaseResult ?? false;

    await utils.updateRuntime(input, (runtime) => {
      runtime.storage.produce<{ [S.CANCEL_PAYMENT]: CancelPaymentStorage }>((draft) => {
        if (draft[S.CANCEL_PAYMENT]) {
          draft[S.CANCEL_PAYMENT].status = result || false;
        }
      });
    });

    return utils.IntentHandler.handle(input);
  },
});

export default CancelPurchaseHandlerGenerator(utilsObj);
