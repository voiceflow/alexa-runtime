import { DefaultApiClient, HandlerInput, SkillBuilders } from 'ask-sdk';

import { MetricsType } from '@/lib/clients/metrics';
import { Source } from '@/lib/constants';

import AdapterManager from '../adapter';
import { Config, Services } from '../utils';
import CustomDynamoDbPersistenceAdapter from './customDynamoAdapter';
import { MemoryPersistenceAdapter } from './local';
import MongoPersistenceAdapter from './mongo';
import {
  APLUserEventHandler,
  AudioPlayerEventHandler,
  CancelPurchaseHandler,
  ErrorHandlerGenerator,
  EventHandler,
  IntentHandler,
  LaunchHandler,
  PermissionHandler,
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

export const RequestInterceptorGenerator = (metrics: MetricsType, adapter: AdapterManager) => ({
  async process(handlerInput: HandlerInput) {
    const { versionID } = handlerInput.context as { versionID: string };
    metrics.invocation(versionID);

    await adapter.context(handlerInput);
  },
});

const utilsObj = {
  handlers: {
    APLUserEventHandler,
    AudioPlayerEventHandler,
    CancelPurchaseHandler,
    ErrorHandlerGenerator,
    PermissionHandler,
    EventHandler,
    IntentHandler,
    LaunchHandler,
    PlaybackControllerHandler,
    PurchaseHandler,
    SessionEndedHandler,
  },
  interceptors: { RequestInterceptorGenerator, ResponseInterceptor },
  builder: SkillBuilders,
  APIClient: DefaultApiClient,
  adapters: {
    MemoryPersistenceAdapter,
    CustomDynamoDbPersistenceAdapter,
    MongoPersistenceAdapter,
  },
};

const AlexaManager = (services: Services, config: Config, utils = utilsObj) => {
  const { handlers, interceptors, builder, APIClient } = utils;
  const { metrics, adapter } = services;

  let persistenceAdapter;

  if (config.SESSIONS_SOURCE === Source.LOCAL) {
    persistenceAdapter = new utils.adapters.MemoryPersistenceAdapter();
  } else if (MongoPersistenceAdapter.enabled(config)) {
    persistenceAdapter = new utils.adapters.MongoPersistenceAdapter(services.mongo!);
  } else {
    persistenceAdapter = new utils.adapters.CustomDynamoDbPersistenceAdapter({
      createTable: false,
      dynamoDBClient: services.dynamo,
      tableName: config.SESSIONS_DYNAMO_TABLE,
    });
  }

  return {
    skill: builder
      .custom()
      .addRequestHandlers(
        handlers.EventHandler,
        handlers.LaunchHandler,
        handlers.IntentHandler,
        handlers.SessionEndedHandler,
        handlers.PlaybackControllerHandler,
        handlers.AudioPlayerEventHandler,
        handlers.PermissionHandler,
        handlers.PurchaseHandler,
        handlers.APLUserEventHandler,
        handlers.CancelPurchaseHandler
      )
      .withApiClient(new APIClient())
      .addErrorHandlers(handlers.ErrorHandlerGenerator(metrics))
      .addRequestInterceptors(interceptors.RequestInterceptorGenerator(metrics, adapter))
      .addResponseInterceptors(interceptors.ResponseInterceptor)
      .withPersistenceAdapter(persistenceAdapter)
      .create(),
  };
};

export default AlexaManager;
