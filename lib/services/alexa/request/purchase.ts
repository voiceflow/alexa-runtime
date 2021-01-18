import { RequestHandler } from 'ask-sdk';
import { interfaces } from 'ask-sdk-model';

import { S } from '@/lib/constants';
import { PaymentStorage } from '@/lib/services/runtime/handlers/payment';

import { AlexaHandlerInput } from '../types';
import { updateRuntime } from '../utils';
import IntentHandler from './intent';

export enum Request {
  RESPONSE_TYPE = 'Connections.Response',
  REQ_NAME = 'Buy',
}

const utilsObj = {
  IntentHandler,
  updateRuntime,
};

export const PurchaseHandlerGenerator = (utils: typeof utilsObj): RequestHandler => ({
  canHandle(input: AlexaHandlerInput): boolean {
    const { request } = input.requestEnvelope;

    return request.type === Request.RESPONSE_TYPE && request.name === Request.REQ_NAME;
  },
  async handle(input: AlexaHandlerInput) {
    const { payload, status } = input.requestEnvelope.request as interfaces.connections.ConnectionsResponse;
    const result: false | undefined | interfaces.monetization.v1.PurchaseResult = +(status?.code || 0) < 300 && payload?.purchaseResult;

    await utils.updateRuntime(input, (runtime) => {
      runtime.storage.produce<{ [S.PAYMENT]: PaymentStorage }>((draft) => {
        if (draft[S.PAYMENT]) {
          draft[S.PAYMENT].status = result || false;
        }
      });
    });

    return utils.IntentHandler.handle(input);
  },
});

export default PurchaseHandlerGenerator(utilsObj);
