import { Program, Version } from '@voiceflow/alexa-types';
import Client, { DataAPI, Runtime } from '@voiceflow/general-runtime/build/runtime';
import { ResponseBuilder as ASKResponseBuilder } from 'ask-sdk';
import { Intent } from 'ask-sdk-model';

export enum RequestType {
  EVENT = 'EVENT',
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
  STARTOVER = 'AMAZON.StartOverIntent',
  REPEAT = 'AMAZON.RepeatIntent',
  SHUFFLE_OFF = 'AMAZON.ShuffleOffIntent',
  SHUFFLE_ON = 'AMAZON.ShuffleOnIntent',
  LOOP_ON = 'AMAZON.LoopOnIntent',
  LOOP_OFF = 'AMAZON.LoopOffIntent',
}

export type IntentRequestPayload = {
  intent: Intent;
};

export type IntentRequest = {
  type: RequestType.INTENT;
  payload: IntentRequestPayload;
};

export type EventRequestPayload = {
  event: string;
  data?: object;
};

export type EventRequest = {
  type: RequestType.EVENT;
  payload: EventRequestPayload;
};

export type AlexaRuntimeRequest = IntentRequest | EventRequest | undefined;

export type AlexaRuntimeClient = Client<AlexaRuntimeRequest, DataAPI<Program.AlexaProgram, Version.AlexaVersion>>;

export type AlexaRuntime = Runtime<AlexaRuntimeRequest, DataAPI<Program.AlexaProgram, Version.AlexaVersion>>;

export type ResponseBuilder = (runtime: AlexaRuntime, builder: ASKResponseBuilder) => void | boolean | Promise<void | boolean>;
