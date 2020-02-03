import { Context, Request } from '@voiceflow/client';
import { ResponseBuilder as ASKResponseBuilder } from 'ask-sdk';
import { Intent } from 'ask-sdk-model';

export type Mapping = { variable: string; slot: string };

export enum RequestType {
  INTENT = 'INTENT',
}

export interface IntentRequestPayload {
  intent: Intent;
}

export interface IntentRequest extends Request {
  type: RequestType.INTENT;
  payload: IntentRequestPayload;
}

export type ResponseBuilder = (context: Context, builder: ASKResponseBuilder) => void | boolean;
