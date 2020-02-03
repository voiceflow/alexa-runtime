import { HandlerInput, RequestHandler } from 'ask-sdk';

import { S } from '@/lib/constants';

import { updateContext } from '../utils';
import IntentHandler from './intent';

enum REQUEST {
  RESPONSE_TYPE = 'Connections.Response',
  REQ_NAME = 'Buy',
}

const PurchaseHandler: RequestHandler = {
  canHandle(input: HandlerInput): boolean {
    const { request } = input.requestEnvelope;
    return request.type === REQUEST.RESPONSE_TYPE && request.name === REQUEST.REQ_NAME;
  },
  async handle(input: HandlerInput) {
    const { payload, status } = input.requestEnvelope.request as any;
    const result = status.code < 300 && payload?.purchaseResult;

    await updateContext(input, (context) => {
      context.storage.set(S.PAYMENT, result || false);
    });

    return IntentHandler.handle(input);
  },
};

export default PurchaseHandler;
