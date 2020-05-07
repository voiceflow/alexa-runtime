import { HandlerInput, SkillBuilders } from 'ask-sdk';
import _ from 'lodash';

import { MetricsType } from '@/lib/clients/metrics';

import AdapterManager from '../adapter';
import { OldContextRaw } from '../adapter/types';
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

export const RequestInterceptorGenerator = (metrics: MetricsType, adapter: AdapterManager) => ({
  async process(handlerInput: HandlerInput) {
    const { versionID } = handlerInput.context as { versionID: string };
    metrics.invocation(versionID);

    // getPersistentAttributes hits dynamo only once during a TURN. the results from dynamo are cached
    // and used for sequent calls to getPersistentAttributes
    const state = await handlerInput.attributesManager.getPersistentAttributes();
    // console.log('rawState', rawState);
    if (!_.isEmpty(state) && !state.stack) {
      // const updatedState = {
      //   stack: [],
      //   variables: state.globals[0],
      //   storage: {
      //     output: state.output,
      //     sessions: state.sessions,
      //     repeat: state.repeat,
      //     alexa_permissions: state.alexa_permissions,
      //     locale: state.locale,
      //     user: state.user,
      //     supported_interfaces: state.supported_interfaces,
      //   },
      // };
      const updatedState = adapter.context(state as OldContextRaw, handlerInput.requestEnvelope.context.System);
      // eslint-disable-next-line no-console
      console.log('updatedState', updatedState);
      handlerInput.attributesManager.setPersistentAttributes(updatedState);
    }
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
  const { metrics, adapter } = services;

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
    .addRequestInterceptors(interceptors.RequestInterceptorGenerator(metrics, adapter))
    .addResponseInterceptors(interceptors.ResponseInterceptor)
    .withDynamoDbClient(services.dynamo)
    .withTableName(config.SESSIONS_DYNAMO_TABLE)
    .withAutoCreateTable(false)
    .create();

  return { skill };
};

export default AlexaManager;
