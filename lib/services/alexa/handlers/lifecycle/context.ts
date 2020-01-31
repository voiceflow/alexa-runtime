import { State } from '@voiceflow/client';
import { HandlerInput } from 'ask-sdk';
import { IntentRequest as AlexaIntentRequest } from 'ask-sdk-model';

import { Context, IntentRequest, RequestType } from '@/lib/services/voiceflow/types';

const context = async (input: HandlerInput): Promise<Context> => {
  const { versionID, voiceflow } = input.context;
  const rawState = await input.attributesManager.getPersistentAttributes();

  const alexaRequest = input.requestEnvelope.request as AlexaIntentRequest;

  let request: IntentRequest = null;
  if (alexaRequest?.intent) {
    request = { type: RequestType.INTENT, payload: alexaRequest };
  }

  const newContext = voiceflow.createContext(versionID, rawState as State, request);
  newContext.turn.set('handlerInput', input);

  return newContext;
};

export default context;
