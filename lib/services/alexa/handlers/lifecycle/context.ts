import Client, { Context, Event, State } from '@voiceflow/client';
import { HandlerInput } from 'ask-sdk';
import { IntentRequest as AlexaIntentRequest } from 'ask-sdk-model';

import { F, S, T } from '@/lib/constants';
import { RESUME_FLOW_ID, ResumeFlow } from '@/lib/services/voiceflow/flows/resume';
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
  newContext.turn.set(T.PREVIOUS_OUTPUT, newContext.storage.get(S.OUTPUT));
  newContext.storage.set(S.OUTPUT, '');

  newContext.setEvent(Event.frameDidFinish, (c: Context) => {
    if (c.stack.top()?.storage.get(F.CALLED_COMMAND)) {
      c.stack.top().storage.delete(F.CALLED_COMMAND);
      newContext.storage.set(S.OUTPUT, c.stack.top().storage.get(F.SPEAK) ?? '');
    }
  });

  newContext.setEvent(Event.diagramWillFetch, (_, diagramID) => {
    if (diagramID === RESUME_FLOW_ID) {
      return ResumeFlow;
    }
  });

  return newContext;
};

export default context;
