/* eslint-disable no-console */
import { ErrorHandler as ErrorHandlerType } from 'ask-sdk';

import { MetricsType } from '@/lib/clients/metrics';
import log from '@/logger';

import { AlexaHandlerInput } from '../types';

const ERROR_MESSAGE = 'something went wrong with this skill, please check again later';

const ErrorHandlerGenerator = (metrics: MetricsType): ErrorHandlerType => ({
  canHandle: (): boolean => true,
  handle: (input: AlexaHandlerInput, error: Error) => {
    // TODO: fully implement error handler

    log.error(error, input.requestEnvelope.request.type);

    const { versionID } = input.context;
    metrics.error(versionID);

    return input.responseBuilder
      .speak(ERROR_MESSAGE)
      .reprompt(ERROR_MESSAGE)
      .withShouldEndSession(true)
      .getResponse();
  },
});

export default ErrorHandlerGenerator;
