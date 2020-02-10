import { ErrorHandler as ErrorHandlerType, HandlerInput } from 'ask-sdk';

const ERROR_MESSAGE = 'something went wrong with this skill, please check again later';

const ErrorHandler: ErrorHandlerType = {
  canHandle: (): boolean => true,
  handle: (input: HandlerInput, error: Error) => {
    // TODO: fully implement error handler

    // eslint-disable-next-line no-console
    console.error(input.requestEnvelope.request.type, error);

    return input.responseBuilder
      .speak(ERROR_MESSAGE)
      .reprompt(ERROR_MESSAGE)
      .withShouldEndSession(true)
      .getResponse();
  },
};

export default ErrorHandler;
