import { Context, Request } from '@voiceflow/client';
import { ResponseBuilder as ASKResponseBuilder } from 'ask-sdk';
import { Intent } from 'ask-sdk-model';

export type Mapping = { variable: string; slot: string };

export enum RequestType {
  INTENT = 'INTENT',
}

export enum IntentName {
  VOICEFLOW = 'VoiceFlowIntent',
  CANCEL = 'AMAZON.CancelIntent',
  STOP = 'AMAZON.StopIntent',
  NEXT = 'AMAZON.NextIntent',
  PREV = 'AMAZON.PreviousIntent',
  PAUSE = 'AMAZON.PauseIntent',
  RESUME = 'AMAZON.ResumeIntent',
  FALLBACK = 'AMAZON.FallbackIntent',
  YES = 'AMAZON.YesIntent',
  NO = 'AMAZON.NoIntent',
}

export interface IntentRequestPayload {
  intent: Intent;
}

export interface IntentRequest extends Request {
  type: RequestType.INTENT;
  payload: IntentRequestPayload;
}

export type ResponseBuilder = (context: Context, builder: ASKResponseBuilder) => void | boolean | Promise<void | boolean>;
