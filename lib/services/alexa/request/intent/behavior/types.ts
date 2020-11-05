import { Context } from '@voiceflow/runtime';
import { HandlerInput } from 'ask-sdk';
import { Response } from 'ask-sdk-model';

export interface ContextRequestHandler {
  canHandle: (input: HandlerInput, context: Context) => boolean;
  handle: (input: HandlerInput, context: Context) => Promise<Response> | Response;
}
