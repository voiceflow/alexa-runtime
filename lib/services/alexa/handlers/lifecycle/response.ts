import { Context, DefaultBlock } from '@voiceflow/client';
import { HandlerInput } from 'ask-sdk';
import { Response } from 'ask-sdk-model';

import { S, T } from '@/lib/constants';
import { Block } from '@/lib/services/voiceflow';
import { responseHandlers } from '@/lib/services/voiceflow/handlers';

const response = async (context: Context<Block | DefaultBlock>, input: HandlerInput): Promise<Response> => {
  let builder = input.responseBuilder;

  const { storage, turn } = context;

  // store access token
  storage.set(S.ACCESS_TOKEN, input.requestEnvelope.context.System.user.accessToken);

  if (context.stack.isEmpty()) {
    turn.set(T.END, true);
  }

  builder
    .speak(storage.get(S.OUTPUT))
    .reprompt(turn.get('reprompt') || storage.get(S.OUTPUT))
    .withShouldEndSession(!!turn.get(T.END));

  // eslint-disable-next-line no-restricted-syntax
  for (const handler of responseHandlers) {
    // eslint-disable-next-line no-await-in-loop
    await handler(context, builder);
  }

  input.attributesManager.setPersistentAttributes(context.getFinalState());

  return builder.getResponse();
};

export default response;
