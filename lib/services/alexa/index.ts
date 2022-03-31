import { DefaultApiClient, SkillBuilders } from 'ask-sdk';

import { MetricsType } from '@/lib/clients/metrics';
import { Source } from '@/lib/constants';

import AdapterManager from '../adapter';
import { Config, Services } from '../utils';
import CustomDynamoDbPersistenceAdapter from './customDynamoAdapter';
import { MemoryPersistenceAdapter } from './local';
import MongoPersistenceAdapter from './mongo';
import PostgresPersistenceAdapter from './postgres';
import {
  APLUserEventHandler,
  AudioPlayerEventHandler,
  CancelPurchaseHandler,
  CanFulfillIntentHandler,
  ErrorHandlerGenerator,
  EventHandler,
  IntentHandler,
  LaunchHandler,
  PermissionHandler,
  PlaybackControllerHandler,
  PurchaseHandler,
  SessionEndedHandler,
} from './request';
import { AlexaHandlerInput } from './types';

export const ResponseInterceptor = {
  async process(handlerInput: AlexaHandlerInput) {
    // save session attributes to persistent attributes
    await handlerInput.attributesManager.savePersistentAttributes();
  },
};

export const RequestInterceptorGenerator = (metrics: MetricsType, adapter: AdapterManager) => ({
  async process(handlerInput: AlexaHandlerInput) {
    const { versionID } = handlerInput.context;

    const decodedVersionID = metrics.invocation(versionID);

    await adapter.state(handlerInput, decodedVersionID);
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
    CanFulfillIntentHandler,
  },
  interceptors: { RequestInterceptorGenerator, ResponseInterceptor },
  builder: SkillBuilders,
  APIClient: DefaultApiClient,
  adapters: {
    MemoryPersistenceAdapter,
    CustomDynamoDbPersistenceAdapter,
    MongoPersistenceAdapter,
    PostgresPersistenceAdapter,
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
  } else if (PostgresPersistenceAdapter.enabled(config)) {
    persistenceAdapter = new utils.adapters.PostgresPersistenceAdapter(services.pg!);
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
        handlers.CanFulfillIntentHandler,
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
