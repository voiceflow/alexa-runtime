import * as Ingest from '@voiceflow/general-runtime/build/lib/clients/ingest-client';
import { Response } from 'ask-sdk-model';
import _isObject from 'lodash/isObject';
import _mapValues from 'lodash/mapValues';

import { S, T, V } from '@/lib/constants';
import { responseHandlers } from '@/lib/services/runtime/handlers';
import { AlexaRuntime } from '@/lib/services/runtime/types';
import log from '@/logger';

import { DirectivesInvalidWithAudioPlayer, speakNotAllowedRequestTypes } from '../../constants';
import { AlexaHandlerInput, Request } from '../../types';

const utilsObj = {
  responseHandlers,
};

export const responseGenerator = (utils: typeof utilsObj) => async (runtime: AlexaRuntime, input: AlexaHandlerInput): Promise<Response> => {
  const { storage, turn, variables } = runtime;
  const {
    responseBuilder,
    attributesManager,
    requestEnvelope: { request },
  } = input;

  if (runtime.stack.isEmpty()) {
    turn.set(T.END, true);
  }

  if (!speakNotAllowedRequestTypes.has(request.type)) {
    responseBuilder.speak(storage.get<string>(S.OUTPUT) ?? '');
    responseBuilder.reprompt((turn.get<string>(T.REPROMPT) || storage.get<string>(S.OUTPUT)) ?? '');
  }

  responseBuilder.withShouldEndSession(!!turn.get(T.END));

  // eslint-disable-next-line no-restricted-syntax
  for (const handler of utils.responseHandlers) {
    // eslint-disable-next-line no-await-in-loop
    await handler(runtime, responseBuilder);
  }

  attributesManager.setPersistentAttributes(runtime.getFinalState());

  const response = responseBuilder.getResponse();

  const { directives } = response;
  if (Array.isArray(directives) && directives.some(({ type }) => DirectivesInvalidWithAudioPlayer.has(type))) {
    // remove AudioPlayer directives if there is a conflicting directive
    response.directives = directives.filter(({ type }) => !type.startsWith(Request.AUDIO_PLAYER));
  }

  if (_isObject(variables.get(V.RESPONSE))) {
    return {
      ...response,
      ..._mapValues(variables.get(V.RESPONSE), (v) => (v === null ? undefined : v)),
    };
  }

  const versionID = runtime.getVersionID();

  // not using async await, since analytics is not blocking operation
  // Track response on analytics system
  runtime.services.analyticsClient
    .track({
      id: versionID,
      event: Ingest.Event.TURN,
      request: input?.requestEnvelope?.request?.type === 'LaunchRequest' ? Ingest.RequestType.LAUNCH : Ingest.RequestType.REQUEST,
      payload: runtime.getRequest(),
      sessionid: input.requestEnvelope.session?.sessionId,
      metadata: runtime.getFinalState(),
      timestamp: new Date(),
    })
    .then((turnID) =>
      // Track response on analytics system
      runtime.services.analyticsClient.track({
        id: versionID,
        event: Ingest.Event.INTERACT,
        request: Ingest.RequestType.RESPONSE,
        payload: response,
        sessionid: input.requestEnvelope.session?.sessionId,
        metadata: runtime.getFinalState(),
        timestamp: new Date(),
        turnIDP: turnID,
      })
    )
    .catch((error: unknown) => log.error(`[analytics] failed to identify ${log.vars({ versionID, error })}`));

  return response;
};

export default responseGenerator(utilsObj);
