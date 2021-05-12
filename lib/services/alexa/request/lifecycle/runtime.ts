import { EventType, State } from '@voiceflow/runtime';

import { S, T, V } from '@/lib/constants';
import { AlexaRuntimeRequest, RequestType } from '@/lib/services/runtime/types';
import log from '@/logger';

import { AlexaHandlerInput, Request } from '../../types';

const buildRuntime = async (input: AlexaHandlerInput) => {
  const { versionID, runtimeClient } = input.context;
  const { attributesManager, requestEnvelope } = input;

  const rawState = (await attributesManager.getPersistentAttributes()) as State;

  const alexaRequest = requestEnvelope.request;

  let request: AlexaRuntimeRequest;

  if (alexaRequest?.type === Request.INTENT) {
    request = { type: RequestType.INTENT, payload: alexaRequest };
  } else if (alexaRequest) {
    request = { type: RequestType.EVENT, payload: { event: alexaRequest.type, data: alexaRequest } };
  }

  const runtime = runtimeClient.createRuntime(versionID, rawState, request);

  runtime.turn.set(T.HANDLER_INPUT, input);
  runtime.turn.set(T.PREVIOUS_OUTPUT, runtime.storage.get(S.OUTPUT));
  runtime.storage.set(S.OUTPUT, '');
  runtime.storage.set(S.ACCESS_TOKEN, requestEnvelope.context.System.user.accessToken);

  runtime.variables.set(V.RESPONSE, null);

  runtime.setEvent(EventType.stateDidCatch, (error) => log.error('RUNTIME STACK ERROR error=%s', JSON.stringify(error)));
  runtime.setEvent(EventType.handlerDidCatch, (error) => log.error('RUNTIME HANDLER ERROR error=%s', JSON.stringify(error)));

  return runtime;
};

export default buildRuntime;
