import { Context, DefaultBlock } from '@voiceflow/client';
import { HandlerInput } from 'ask-sdk';
import { Response } from 'ask-sdk-model';

import { S, T } from '@/lib/constants';
import { Block } from '@/lib/services/voiceflow';

const response = async (context: Context<Block | DefaultBlock>, input: HandlerInput): Promise<Response> => {
  let builder = input.responseBuilder;

  const { storage, turn } = context;

  // store access token
  storage.set(S.ACCESS_TOKEN, input.requestEnvelope.context.System.user.accessToken);

  if (context.stack.isEmpty()) {
    turn.set(T.END, true);
  }

  builder = builder
    .speak(storage.get(S.OUTPUT))
    .reprompt(turn.get('reprompt') || storage.get(S.OUTPUT))
    .withShouldEndSession(!!turn.get(T.END));

  // check account linking
  if (turn.get(T.ACCOUNT_LINKING)) builder = builder.withLinkAccountCard();

  // check permissions card
  const permissionCard = turn.get(T.PERMISSION_CARD);
  if (permissionCard) {
    const permissions = Array.isArray(permissionCard) ? permissionCard : storage.get(S.ALEXA_PERMISSIONS);
    if (permissions?.length) builder = builder.withAskForPermissionsConsentCard(permissions);
  }

  input.attributesManager.setPersistentAttributes(context.getFinalState());
  return builder.getResponse();
};

export default response;
