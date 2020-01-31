import { HandlerInput, RequestHandler } from 'ask-sdk';

import { S } from '@/lib/constants';

import { updateContext } from '../utils';
import IntentHandler from './intent';

const PurchaseHandler: RequestHandler = {
  canHandle(input: HandlerInput): boolean {
    const { request } = input.requestEnvelope;
    return request.type === 'Connections.Response' && request.name === 'Buy';
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
