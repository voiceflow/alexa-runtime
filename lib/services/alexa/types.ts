import { Program, Version } from '@voiceflow/alexa-types';
import { DataAPI } from '@voiceflow/general-runtime/build/runtime';
import { HandlerInput } from 'ask-sdk';

import { AlexaRuntimeClient } from '@/lib/services/runtime/types';

export interface AlexaContext {
  api: DataAPI<Program.AlexaProgram, Version.AlexaVersion>;
  versionID: string;
  runtimeClient: AlexaRuntimeClient;
}

export type AlexaHandlerInput = Omit<HandlerInput, 'context'> & {
  context: AlexaContext;
};

export enum Request {
  INTENT = 'IntentRequest',
  AUDIO_PLAYER = 'AudioPlayer.',
  SKILL_EVENT_ROOT = 'AlexaSkillEvent.',
  PERMISSION_ACCEPTED = 'AlexaSkillEvent.SkillPermissionAccepted',
  PERMISSION_CHANGED = 'AlexaSkillEvent.SkillPermissionChanged',
}
