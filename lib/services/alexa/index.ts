import ASK, { HandlerInput, SkillBuilders } from 'ask-sdk';

import { injectServices } from '../types';
import { Config, Services } from '../utils';
import {
  APLUserEventHandler,
  AudioPlayerEventHandler,
  CancelPurchaseHandler,
  ErrorHandler,
  EventHandler,
  IntentHandler,
  LaunchHandler,
  PlaybackControllerHandler,
  PurchaseHandler,
  SessionEndedHandler,
} from './request';

export const ResponseInterceptor = {
  async process(handlerInput: HandlerInput) {
    // save session attributes to persistent attributes
    await handlerInput.attributesManager.savePersistentAttributes();
  },
};

const utilsObj = {
  handlers: {
    APLUserEventHandler,
    AudioPlayerEventHandler,
    CancelPurchaseHandler,
    ErrorHandler,
    EventHandler,
    IntentHandler,
    LaunchHandler,
    PlaybackControllerHandler,
    PurchaseHandler,
    SessionEndedHandler,
  },
  interceptors: { ResponseInterceptor },
  builder: SkillBuilders,
};

const AlexaManager = (services: Services, config: Config, utils = utilsObj) => {
  const { handlers, interceptors, builder } = utils;

  const skill = builder
    .standard()
    .addRequestHandlers(
      handlers.LaunchHandler,
      handlers.IntentHandler,
      handlers.SessionEndedHandler,
      handlers.PlaybackControllerHandler,
      handlers.AudioPlayerEventHandler,
      handlers.EventHandler,
      handlers.PurchaseHandler,
      handlers.APLUserEventHandler,
      handlers.CancelPurchaseHandler
    )
    .addErrorHandlers(handlers.ErrorHandler)
    // .addRequestInterceptors(RequestInterceptor)
    .addResponseInterceptors(interceptors.ResponseInterceptor)
    .withDynamoDbClient(services.dynamo)
    .withTableName(config.SESSIONS_DYNAMO_TABLE)
    .withAutoCreateTable(false)
    .create();

  return { skill };
};

export default AlexaManager;
