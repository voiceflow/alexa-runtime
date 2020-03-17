import ASK, { HandlerInput, SkillBuilders } from 'ask-sdk';

import { injectServices } from '../types';
import { AbstractManager } from '../utils';
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
} from './handlers';

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

@injectServices({ utils: utilsObj })
class AlexaManager extends AbstractManager<{ utils: typeof utilsObj }> {
  skill(): ASK.Skill {
    const { handlers, interceptors, builder } = this.services.utils;

    return (
      builder
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
        .withDynamoDbClient(this.services.dynamo)
        .withTableName(this.config.SESSIONS_DYNAMO_TABLE)
        .withAutoCreateTable(false)
        .create()
    );
  }
}

export default AlexaManager;
