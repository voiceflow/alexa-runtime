import { HandlerInput, SkillBuilders } from 'ask-sdk';

import { Config } from '@/types';

import { FullServiceMap } from '..';
import {
  APLUserEventHandler,
  CancelPurchaseHandler,
  ErrorHandler,
  EventHandler,
  IntentHandler,
  LaunchHandler,
  PlaybackControllerHandler,
  PurchaseHandler,
  SessionEndedHandler,
} from './handlers';

const ResponseInterceptor = {
  async process(handlerInput: HandlerInput) {
    // save session attributes to persistent attributes
    await handlerInput.attributesManager.savePersistentAttributes();
  },
};

const Alexa = (services: FullServiceMap, config: Config) =>
  SkillBuilders.standard()
    .addRequestHandlers(
      LaunchHandler,
      IntentHandler,
      PlaybackControllerHandler,
      EventHandler,
      PurchaseHandler,
      CancelPurchaseHandler,
      APLUserEventHandler,
      SessionEndedHandler
    )
    .addErrorHandlers(ErrorHandler)
    // .addRequestInterceptors(RequestInterceptor)
    .addResponseInterceptors(ResponseInterceptor)
    .withDynamoDbClient(services.dynamo)
    .withTableName(config.SESSIONS_DYNAMO_TABLE)
    .withAutoCreateTable(false)
    .create();

export default Alexa;
