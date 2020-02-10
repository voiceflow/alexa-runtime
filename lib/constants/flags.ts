export enum Storage {
  ALEXA_PERMISSIONS = 'alexa_permissions',
  OUTPUT = 'output',
  SESSIONS = 'sessions',
  REPEAT = 'repeat',
  LOCALE = 'locale',
  USER = 'user',
  ACCESS_TOKEN = 'accessToken',
  PERMISSIONS = 'permissions',
  PAYMENT = 'payment',
  CANCEL_PAYMENT = 'cancel_payment',
  STREAM_PLAY = 'stream_play',
  STREAM_PAUSE = 'stream_pause',
  STREAM_FINISHED = 'stream_finished',
  STREAM_TEMP = 'stream_temp',
}

export enum Turn {
  AUDIO = 'play',
  PERMISSION_CARD = 'permissionCard',
  ACCOUNT_LINKING = 'accountLinking',
  END = 'end',
  PREVIOUS_OUTPUT = 'lastOutput',
  REPROMPT = 'reprompt',
  REQUEST = 'request',
  CARD = 'card',
  HANDLER_INPUT = 'handlerInput',
}

export enum Frame {
  SPEAK = 'speak',
  CALLED_COMMAND = 'calledCommand',
}

export default {
  Storage,
  Turn,
  Frame,
};
