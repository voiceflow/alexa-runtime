import { Context, Request } from '@voiceflow/runtime';
import { ResponseBuilder as ASKResponseBuilder } from 'ask-sdk';
import { Intent } from 'ask-sdk-model';

export enum RequestType {
  INTENT = 'INTENT',
  EVENT = 'EVENT',
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
  STARTOVER = 'AMAZON.StartOverIntent',
  REPEAT = 'AMAZON.RepeatIntent',
  SHUFFLE_OFF = 'AMAZON.ShuffleOffIntent',
  SHUFFLE_ON = 'AMAZON.ShuffleOnIntent',
  LOOP_ON = 'AMAZON.LoopOnIntent',
  LOOP_OFF = 'AMAZON.LoopOffIntent',
}

export interface IntentRequestPayload {
  intent: Intent;
  input?: string; // test tool only
}

export interface IntentRequest extends Request {
  type: RequestType.INTENT;
  payload: IntentRequestPayload;
}

export interface EventRequestPayload {
  event: string;
  data?: object;
}

export interface EventRequest extends Request {
  type: RequestType.EVENT;
  payload: EventRequestPayload;
}

export type ResponseBuilder = (context: Context, builder: ASKResponseBuilder) => void | boolean | Promise<void | boolean>;
