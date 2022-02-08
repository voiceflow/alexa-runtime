import { AlexaProgram, AlexaVersion } from '@voiceflow/alexa-types';
import { DataAPI } from '@voiceflow/general-runtime/build/runtime';
import { HandlerInput } from 'ask-sdk';

import { AlexaRuntimeClient } from '@/lib/services/runtime/types';

export interface AlexaContext {
  api: DataAPI<AlexaProgram.Program, AlexaVersion.Version>;
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
  PERMISSION_CHANGED = 'AlexaSkillEvent.SkillPermissionChanged',
  PERMISSION_ACCEPTED = 'AlexaSkillEvent.SkillPermissionAccepted',
  AUDIO_PLAYER_PLAYBACK_FAILED = 'AudioPlayer.PlaybackFailed',
  AUDIO_PLAYER_PLAYBACK_STARTED = 'AudioPlayer.PlaybackStarted',
  AUDIO_PLAYER_PLAYBACK_STOPPED = 'AudioPlayer.PlaybackStopped',
  AUDIO_PLAYER_PLAYBACK_FINISHED = 'AudioPlayer.PlaybackFinished',
  AUDIO_PLAYER_PLAYBACK_NEARLY_FINISHED = 'AudioPlayer.PlaybackNearlyFinished',
}
