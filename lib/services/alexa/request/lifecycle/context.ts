import Client, { Context, State } from '@voiceflow/client';
import { HandlerInput } from 'ask-sdk';

import { S, T } from '@/lib/constants';
import { EventRequest, IntentRequest, RequestType } from '@/lib/services/voiceflow/types';

import { Request } from '../../types';

const context = async (input: HandlerInput): Promise<Context> => {
  const { versionID, voiceflow } = input.context as { versionID: string; voiceflow: Client };
  const { attributesManager, requestEnvelope } = input;

  const rawState = await attributesManager.getPersistentAttributes(requestEnvelope.session?.new);

  const alexaRequest = requestEnvelope.request;

  let request: IntentRequest | EventRequest | undefined;

  if (alexaRequest?.type === Request.INTENT) {
    request = { type: RequestType.INTENT, payload: alexaRequest };
  } else if (alexaRequest) {
    request = { type: RequestType.EVENT, payload: { event: alexaRequest.type, data: alexaRequest } };
  }

  const newContext = voiceflow.createContext(versionID, rawState as State, request);

  newContext.turn.set(T.HANDLER_INPUT, input);
  newContext.turn.set(T.PREVIOUS_OUTPUT, newContext.storage.get(S.OUTPUT));
  newContext.storage.set(S.OUTPUT, '');
  newContext.storage.set(S.ACCESS_TOKEN, requestEnvelope.context.System.user.accessToken);

  return newContext;
};

export default context;
