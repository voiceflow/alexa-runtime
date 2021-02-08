import { AlexaProgram, AlexaVersion } from '@voiceflow/alexa-types';
import { DataAPI } from '@voiceflow/runtime';
import { HandlerInput } from 'ask-sdk';

import { AlexaRuntimeClient } from '@/lib/services/runtime/types';

export type AlexaContext = {
  api: DataAPI<AlexaProgram, AlexaVersion>;
  versionID: string;
  runtimeClient: AlexaRuntimeClient;
};

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
