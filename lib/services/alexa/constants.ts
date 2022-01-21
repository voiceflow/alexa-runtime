import { Request } from './types';

export const SEND_REQUEST_DIRECTIVE = 'Connections.SendRequest';

export const DirectivesInvalidWithAudioPlayer = new Set([SEND_REQUEST_DIRECTIVE]);

export const speakNotAllowedRequestTypes = new Set<string>([
  Request.AUDIO_PLAYER_PLAYBACK_FAILED,
  Request.AUDIO_PLAYER_PLAYBACK_FINISHED,
  Request.AUDIO_PLAYER_PLAYBACK_NEARLY_FINISHED,
  Request.AUDIO_PLAYER_PLAYBACK_STARTED,
  Request.AUDIO_PLAYER_PLAYBACK_STOPPED,
]);
