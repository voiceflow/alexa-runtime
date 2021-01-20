/* eslint-disable no-console */
import { ErrorHandler as ErrorHandlerType } from 'ask-sdk';

import { MetricsType } from '@/lib/clients/metrics';
import log from '@/logger';

import { AlexaHandlerInput } from '../types';

const ERROR_MESSAGE = 'something went wrong with this skill, please check again later';
const SYSTEM_ERROR = 'System.ExceptionEncountered';

const ErrorHandlerGenerator = (metrics: MetricsType): ErrorHandlerType => ({
  canHandle: (): boolean => true,
  handle: (input: AlexaHandlerInput, error: Error) => {
    if (input.requestEnvelope.request.type === SYSTEM_ERROR) {
      log.error(input.requestEnvelope.request.error);
    } else {
      log.error(error);
    }

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
