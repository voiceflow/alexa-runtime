export enum Storage {
  ALEXA_PERMISSIONS = 'alexa_permissions',
  OUTPUT = 'output',
  SESSIONS = 'sessions',
  REPEAT = 'repeat',
  LOCALE = 'locale',
  USER = 'user',
}

export enum Turn {
  AUDIO = 'play',
  PERMISSION_CARD = 'permission_card',
  END = 'end',
  PREVIOUS_OUTPUT = 'lastOutput',
  REPROMPT = 'reprompt',
}

export enum Request {
  INTENT = 'intent',
  MAPPINGS = 'mappings',
}

export default {
  Storage,
  Turn,
  Request,
};
