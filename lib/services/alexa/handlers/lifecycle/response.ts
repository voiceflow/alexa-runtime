import { HandlerInput } from 'ask-sdk';
import { Response } from 'ask-sdk-model';

import { S, T } from '@/lib/constants';
import { responseBuilder as cardResponseBuilder } from '@/lib/services/voiceflow/handlers/card';
import { Context } from '@/lib/services/voiceflow/types';

const response = async (context: Context, input: HandlerInput): Promise<Response> => {
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

  cardResponseBuilder(turn, builder);

  input.attributesManager.setPersistentAttributes(context.getFinalState());

  return builder.getResponse();
};

export default response;
