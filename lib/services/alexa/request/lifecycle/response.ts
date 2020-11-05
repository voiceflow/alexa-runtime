import { Context } from '@voiceflow/runtime';
import { HandlerInput } from 'ask-sdk';
import { Response } from 'ask-sdk-model';

import { S, T } from '@/lib/constants';
import { responseHandlers } from '@/lib/services/voiceflow/handlers';

const utilsObj = {
  responseHandlers,
};

export const responseGenerator = (utils: typeof utilsObj) => async (context: Context, input: HandlerInput): Promise<Response> => {
  const { storage, turn } = context;
  const { responseBuilder, attributesManager } = input;

  if (context.stack.isEmpty()) {
    turn.set(T.END, true);
  }

  responseBuilder
    .speak(storage.get<string>(S.OUTPUT) ?? '')
    .reprompt((turn.get<string>('reprompt') || storage.get<string>(S.OUTPUT)) ?? '')
    .withShouldEndSession(!!turn.get(T.END));

  // eslint-disable-next-line no-restricted-syntax
  for (const handler of utils.responseHandlers) {
    // eslint-disable-next-line no-await-in-loop
    await handler(context, responseBuilder);
  }

  attributesManager.setPersistentAttributes(context.getFinalState());

  return responseBuilder.getResponse();
};

export default responseGenerator(utilsObj);
