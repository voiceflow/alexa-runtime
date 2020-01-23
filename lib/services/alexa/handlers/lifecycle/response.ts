import { Context } from '@voiceflow/client';
import { HandlerInput } from 'ask-sdk';

import { S, T } from '@/lib/constants';

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

  // check permissions card needed
  // const permissionCard = turn.get(Turn.PERMISSION_CARD);
  // if (permissionCard) {
  //   const perms = (Array.isArray(permissionCard) && permissionCard) ?? storage.get(Storage.ALEXA_PERMISSIONS) ?? [];
  //   if (perms.length) {
  //     builder = builder.withAskForPermissionsConsentCard(perms);
  //   }
  // }

  input.attributesManager.setPersistentAttributes(context.getFinalState());
  return builder.getResponse();
};

export default response;
