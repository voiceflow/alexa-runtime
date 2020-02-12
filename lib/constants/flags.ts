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
  SUPPORTED_INTERFACES = 'supported_interfaces',
  DISPLAY_INFO = 'display_info',
  AWAITING_VIDEO_ENDED_EVENT = 'awaiting_videoended_event',
  NEXT_ID = 'next_id',
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
