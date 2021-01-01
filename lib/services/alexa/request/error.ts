/* eslint-disable no-console */
import { ErrorHandler as ErrorHandlerType, HandlerInput } from 'ask-sdk';

import { MetricsType } from '@/lib/clients/metrics';

const ERROR_MESSAGE = 'something went wrong with this skill, please check again later';

const ErrorHandlerGenerator = (metrics: MetricsType): ErrorHandlerType => ({
  canHandle: (): boolean => true,
  handle: (input: HandlerInput, error: Error) => {
    // TODO: fully implement error handler

    console.error(error, input.requestEnvelope.request.type);

    const { versionID } = input.context as { versionID: string };
    metrics.error(versionID);

    return input.responseBuilder
      .speak(ERROR_MESSAGE)
      .reprompt(ERROR_MESSAGE)
      .withShouldEndSession(true)
      .getResponse();
  },
});

export default ErrorHandlerGenerator;
