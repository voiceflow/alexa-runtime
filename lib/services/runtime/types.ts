import { AlexaConstants, AlexaProgram, AlexaVersion } from '@voiceflow/alexa-types';
import Client, { DataAPI, Runtime } from '@voiceflow/general-runtime/build/runtime';
import { ResponseBuilder as ASKResponseBuilder } from 'ask-sdk';
import { Intent } from 'ask-sdk-model';

import { FullServiceMap } from '..';

export interface Prompt {
  voice: AlexaConstants.Voice;
  content: string;
}

export const isPrompt = (prompt: unknown): prompt is Prompt => {
  if (!prompt || typeof prompt !== 'object') return false;
  return 'voice' in prompt && 'content' in prompt;
};

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

export interface IntentRequestPayload {
  intent: Intent;
}

export interface IntentRequest {
  type: RequestType.INTENT;
  payload: IntentRequestPayload;
  diagramID?: string;
}

export interface EventRequestPayload {
  event: string;
  data?: Record<string, any>;
}

export interface EventRequest {
  type: RequestType.EVENT;
  payload: EventRequestPayload;
}

export type AlexaRuntimeRequest = IntentRequest | EventRequest | undefined;

export type AlexaRuntimeClient = Client<
  AlexaRuntimeRequest,
  DataAPI<AlexaProgram.Program, AlexaVersion.Version>,
  FullServiceMap
>;

export type AlexaRuntime = Runtime<
  AlexaRuntimeRequest,
  DataAPI<AlexaProgram.Program, AlexaVersion.Version>,
  FullServiceMap
>;

export type ResponseBuilder = (
  runtime: AlexaRuntime,
  builder: ASKResponseBuilder
) => void | boolean | Promise<void | boolean>;
