import { Response } from 'ask-sdk-model';
import _isObject from 'lodash/isObject';
import _mapValues from 'lodash/mapValues';

import { Event, RequestType } from '@/lib/clients/ingest-client';
import { S, T, V } from '@/lib/constants';
import { responseHandlers } from '@/lib/services/runtime/handlers';
import { AlexaRuntime } from '@/lib/services/runtime/types';
import logger from '@/logger';

import { DirectivesInvalidWithAudioPlayer } from '../../constants';
import { AlexaHandlerInput, Request } from '../../types';

const utilsObj = {
  responseHandlers,
};

export const responseGenerator = (utils: typeof utilsObj) => async (runtime: AlexaRuntime, input: AlexaHandlerInput): Promise<Response> => {
  const { storage, turn, variables } = runtime;
  const { responseBuilder, attributesManager } = input;

  if (runtime.stack.isEmpty()) {
    turn.set(T.END, true);
  }

  responseBuilder
    .speak(storage.get<string>(S.OUTPUT) ?? '')
    .reprompt((turn.get<string>('reprompt') || storage.get<string>(S.OUTPUT)) ?? '')
    .withShouldEndSession(!!turn.get(T.END));

  // eslint-disable-next-line no-restricted-syntax
  for (const handler of utils.responseHandlers) {
    // eslint-disable-next-line no-await-in-loop
    await handler(runtime, responseBuilder);
  }

  attributesManager.setPersistentAttributes(runtime.getFinalState());

  const response = responseBuilder.getResponse();

  const { directives } = response;
  if (Array.isArray(directives)) {
    // remove AudioPlayer directives if there is a conflicting directive
    if (directives.some(({ type }) => DirectivesInvalidWithAudioPlayer.has(type))) {
      response.directives = directives.filter(({ type }) => !type.startsWith(Request.AUDIO_PLAYER));
    }
  }

  if (_isObject(variables.get(V.RESPONSE))) {
    return {
      ...response,
      ..._mapValues(variables.get(V.RESPONSE), (v) => (v === null ? undefined : v)),
    };
  }

  // Track response on analytics system
  runtime.services.analyticsClient
    .track({
      id: runtime.getVersionID(),
      event: Event.TURN,
      request: input?.requestEnvelope?.request?.type === 'LaunchRequest' ? RequestType.LAUNCH : RequestType.REQUEST,
      payload: runtime.getRequest(),
      sessionid: input.requestEnvelope.session?.sessionId,
      metadata: runtime.getFinalState(),
      timestamp: new Date(),
    })
    // Track response on analytics system
    .then((turnID: string) =>
      runtime.services.analyticsClient.track({
        id: runtime.getVersionID(),
        event: Event.INTERACT,
        request: RequestType.RESPONSE,
        payload: response,
        sessionid: input.requestEnvelope.session?.sessionId,
        metadata: runtime.getFinalState(),
        timestamp: new Date(),
        turnIDP: turnID,
      })
    )
    .catch((error: Error) => {
      logger.error(error);
    });

  return response;
};

export default responseGenerator(utilsObj);
