import { HandlerInput } from 'ask-sdk';

import { S, T } from '@/lib/constants';
import { Context } from '@/lib/services/voiceflow/types';

const response = async (context: Context, input: HandlerInput): Promise<import('ask-sdk-model').Response> => {
  let builder = input.responseBuilder;

  const { storage, turn } = context;

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
