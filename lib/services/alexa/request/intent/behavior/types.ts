import { Response } from 'ask-sdk-model';

import { AlexaRuntime } from '@/lib/services/runtime/types';

import { AlexaHandlerInput } from '../../../types';

export interface ContextRequestHandler {
  canHandle: (input: AlexaHandlerInput, runtime: AlexaRuntime) => boolean;
  handle: (input: AlexaHandlerInput, runtime: AlexaRuntime) => Promise<Response> | Response;
}
