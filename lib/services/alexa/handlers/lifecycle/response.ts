import { Context } from '@voiceflow/client';
import { HandlerInput, RequestHandler } from 'ask-sdk';
import { Response } from 'ask-sdk-model';

const response = async (context: Context, input: HandlerInput): Promise<Response> => {
  const builder = input.responseBuilder;

  input.attributesManager.setPersistentAttributes(context.getFinalState());
  return builder.getResponse();
};

export default response;
