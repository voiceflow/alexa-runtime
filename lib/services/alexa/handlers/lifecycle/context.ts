import Client, { Context, Event, State } from '@voiceflow/client';
import { HandlerInput } from 'ask-sdk';
import { IntentRequest as AlexaIntentRequest } from 'ask-sdk-model';

import { T } from '@/lib/constants';
import { executeEvents } from '@/lib/services/voiceflow/handlers/events';
import { IntentRequest, RequestType } from '@/lib/services/voiceflow/types';

const context = async (input: HandlerInput): Promise<Context> => {
  const { versionID, voiceflow } = input.context as { versionID: string; voiceflow: Client };
  const { attributesManager, requestEnvelope } = input;

  const rawState = await attributesManager.getPersistentAttributes();

  const alexaRequest = requestEnvelope.request as AlexaIntentRequest;

  let request: IntentRequest | undefined;

  if (alexaRequest?.intent) {
    request = { type: RequestType.INTENT, payload: alexaRequest };
  }

  const newContext = voiceflow.createContext(versionID, rawState as State, request);
  newContext.turn.set(T.HANDLER_INPUT, input);

  newContext.setEvent(Event.stateDidExecute, (...args) => executeEvents(Event.stateDidExecute, ...args));

  return newContext;
};

export default context;
