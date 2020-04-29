import { HandlerInput, SkillBuilders } from 'ask-sdk';

import { MetricsType } from '@/lib/clients/metrics';

import { Config, Services } from '../utils';
import {
  APLUserEventHandler,
  AudioPlayerEventHandler,
  CancelPurchaseHandler,
  ErrorHandlerGenerator,
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

export const RequestInterceptorGenerator = (metrics: MetricsType) => ({
  async process(handlerInput: HandlerInput) {
    const { decodedVersionID } = handlerInput.context as { decodedVersionID: number };
    metrics.increment('alexa.invocation', 1, [`skill_id:${decodedVersionID}`]);
  },
});

const utilsObj = {
  handlers: {
    APLUserEventHandler,
    AudioPlayerEventHandler,
    CancelPurchaseHandler,
    ErrorHandlerGenerator,
    EventHandler,
    IntentHandler,
    LaunchHandler,
    PlaybackControllerHandler,
    PurchaseHandler,
    SessionEndedHandler,
  },
  interceptors: { RequestInterceptorGenerator, ResponseInterceptor },
  builder: SkillBuilders,
};

const AlexaManager = (services: Services, config: Config, utils = utilsObj) => {
  const { handlers, interceptors, builder } = utils;
  const { metrics } = services;

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
    .addErrorHandlers(handlers.ErrorHandlerGenerator(metrics))
    .addRequestInterceptors(interceptors.RequestInterceptorGenerator(metrics))
    .addResponseInterceptors(interceptors.ResponseInterceptor)
    .withDynamoDbClient(services.dynamo)
    .withTableName(config.SESSIONS_DYNAMO_TABLE)
    .withAutoCreateTable(false)
    .create();

  return { skill };
};

export default AlexaManager;
