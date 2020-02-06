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

export default {
  Storage,
  Turn,
};
