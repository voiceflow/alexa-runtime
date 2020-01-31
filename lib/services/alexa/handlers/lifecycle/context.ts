import Client, { Context, DefaultBlock, State } from '@voiceflow/client';
import { HandlerInput } from 'ask-sdk';
import { IntentRequest as AlexaIntentRequest } from 'ask-sdk-model';

import { IntentRequest, RequestType } from '@/lib/services/voiceflow/types';
import { Block } from '@/lib/services/voiceflow';

const context = async (input: HandlerInput): Promise<Context<Block | DefaultBlock>> => {
  const { versionID, voiceflow } = input.context as { versionID: string; voiceflow: Client<Block> };
  const rawState = await input.attributesManager.getPersistentAttributes();

  const alexaRequest = input.requestEnvelope.request as AlexaIntentRequest;

  let request: IntentRequest | undefined;

  if (alexaRequest?.intent) {
    request = { type: RequestType.INTENT, payload: alexaRequest };
  }

  const newContext = voiceflow.createContext(versionID, rawState as State, request);
  newContext.turn.set('handlerInput', input);

  return newContext;
};

export default context;
