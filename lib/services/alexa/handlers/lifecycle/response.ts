import { Context } from '@voiceflow/client';
import { HandlerInput } from 'ask-sdk';
import { Response } from 'ask-sdk-model';

import { S, T } from '@/lib/constants';
import { responseHandlers } from '@/lib/services/voiceflow/handlers';

const response = async (context: Context, input: HandlerInput): Promise<Response> => {
  const { storage, turn } = context;
  const { responseBuilder, requestEnvelope, attributesManager } = input;

  // store access token
  storage.set(S.ACCESS_TOKEN, requestEnvelope.context.System.user.accessToken);

  if (context.stack.isEmpty()) {
    turn.set(T.END, true);
  }

  responseBuilder
    .speak(storage.get(S.OUTPUT))
    .reprompt(turn.get('reprompt') || storage.get(S.OUTPUT))
    .withShouldEndSession(!!turn.get(T.END));

  // eslint-disable-next-line no-restricted-syntax
  for (const handler of responseHandlers) {
    // eslint-disable-next-line no-await-in-loop
    await handler(context, responseBuilder);
  }

  attributesManager.setPersistentAttributes(context.getFinalState());

  return responseBuilder.getResponse();
};

export default response;
