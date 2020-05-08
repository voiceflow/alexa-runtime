export enum Storage {
  ALEXA_PERMISSIONS = 'alexa_permissions',
  OUTPUT = 'output',
  SESSIONS = 'sessions',
  REPEAT = 'repeat',
  LOCALE = 'locale',
  USER = 'user',
  SUPPORTED_INTERFACES = 'supported_interfaces',
  ACCESS_TOKEN = 'accessToken',
  PERMISSIONS = 'permissions',
  PAYMENT = 'payment',
  CANCEL_PAYMENT = 'cancelPayment',
  DISPLAY_INFO = 'displayInfo',
  // -- todo
  STREAM_PLAY = 'streamPlay',
  STREAM_PAUSE = 'streamPause',
  STREAM_FINISHED = 'streamFinished',
  STREAM_TEMP = 'streamTemp',
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
  TRACE = 'trace',
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
