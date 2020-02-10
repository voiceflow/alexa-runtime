import { HandlerInput, RequestHandler } from 'ask-sdk';

enum Request {
  SESSION_ENDED = 'SessionEndedRequest',
}

const SessionEndedHandler: RequestHandler = {
  canHandle(input: HandlerInput): boolean {
    const { type } = input.requestEnvelope.request;

    return type === Request.SESSION_ENDED;
  },
  handle: (input: HandlerInput) => {
    // eslint-disable-next-line no-console
    console.log('session ended error:', input.requestEnvelope.request);
    return input.responseBuilder.getResponse();
  },
};

export default SessionEndedHandler;
