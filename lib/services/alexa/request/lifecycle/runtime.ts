import { EventType, State } from '@voiceflow/general-runtime/build/runtime';
import safeJSONStringify from 'json-stringify-safe';

import { S, T, V } from '@/lib/constants';
import { AlexaRuntimeRequest, RequestType } from '@/lib/services/runtime/types';
import log from '@/logger';

import { AlexaHandlerInput, Request } from '../../types';

const buildRuntime = async (input: AlexaHandlerInput) => {
  const { versionID, runtimeClient, api } = input.context;
  const { attributesManager, requestEnvelope } = input;

  const rawState = (await attributesManager.getPersistentAttributes()) as State;

  const { request: alexaRequest, context } = requestEnvelope;

  let request: AlexaRuntimeRequest;

  if (alexaRequest?.type === Request.INTENT) {
    request = { type: RequestType.INTENT, payload: alexaRequest };
  } else if (alexaRequest) {
    request = { type: RequestType.EVENT, payload: { event: alexaRequest.type, data: alexaRequest } };
  }

  const version = await api.getVersion(versionID);
  const runtime = runtimeClient.createRuntime(versionID, rawState, request, undefined, version);
  const { turn, storage, variables } = runtime;
  const system = context?.System;

  turn.set(T.HANDLER_INPUT, input);
  runtime.turn.set(T.PREVIOUS_OUTPUT, storage.get(S.OUTPUT));
  storage.set(S.OUTPUT, '');
  storage.set(S.ACCESS_TOKEN, system?.user?.accessToken);
  storage.set(S.SUPPORTED_INTERFACES, system?.device?.supportedInterfaces);

  // hidden system variables (code node only)
  variables.merge({
    [V.VOICEFLOW]: {
      // TODO: implement all exposed voiceflow variables
      permissions: storage.get(S.ALEXA_PERMISSIONS),
      capabilities: system?.device?.supportedInterfaces,
      viewport: requestEnvelope.context?.Viewport,
      events: [],
    },
    [V.SYSTEM]: system,
    [V.CONTEXT]: context,
    // reset response
    [V.RESPONSE]: null,
  });

  runtime.setEvent(EventType.stateDidCatch, (error) =>
    log.error(`[app] [runtime] stack error caught ${log.vars({ error: safeJSONStringify(error) })}`)
  );
  runtime.setEvent(EventType.handlerDidCatch, (error) =>
    log.error(`[app] [runtime] handler error caught ${log.vars({ error: safeJSONStringify(error) })}`)
  );

  return runtime;
};

export default buildRuntime;
