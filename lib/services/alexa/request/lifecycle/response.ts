import { Response } from 'ask-sdk-model';

import { S, T } from '@/lib/constants';
import { responseHandlers } from '@/lib/services/runtime/handlers';
import { AlexaRuntime } from '@/lib/services/runtime/types';

import { AlexaHandlerInput } from '../../types';

const utilsObj = {
  responseHandlers,
};

export const responseGenerator = (utils: typeof utilsObj) => async (runtime: AlexaRuntime, input: AlexaHandlerInput): Promise<Response> => {
  const { storage, turn } = runtime;
  const { responseBuilder, attributesManager } = input;

  if (runtime.stack.isEmpty()) {
    turn.set(T.END, true);
  }

  responseBuilder
    .speak(storage.get<string>(S.OUTPUT) ?? '')
    .reprompt((turn.get<string>('reprompt') || storage.get<string>(S.OUTPUT)) ?? '')
    .withShouldEndSession(!!turn.get(T.END));

  // eslint-disable-next-line no-restricted-syntax
  for (const handler of utils.responseHandlers) {
    // eslint-disable-next-line no-await-in-loop
    await handler(runtime, responseBuilder);
  }

  attributesManager.setPersistentAttributes(runtime.getFinalState());

  return responseBuilder.getResponse();
};

export default responseGenerator(utilsObj);
