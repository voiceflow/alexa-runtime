import ASK from 'ask-sdk';

import { Config } from '@/types';

import { FullServiceMap } from '..';
import { AudioplayerHandler, IntentHandler, LaunchHandler } from './handlers';

const ResponseInterceptor = {
  async process(handlerInput) {
    // save session attributes to persistent attributes
    await handlerInput.attributesManager.savePersistentAttributes();
  },
};

const Alexa = (services: FullServiceMap, config: Config) =>
  ASK.SkillBuilders.standard()
    .addRequestHandlers(LaunchHandler, IntentHandler, AudioplayerHandler)
    .addErrorHandlers(errorHandler)
    // .addRequestInterceptors(RequestInterceptor)
    .addResponseInterceptors(ResponseInterceptor)
    .withTableName(config.SESSIONS_DYNAMO_TABLE)
    .withAutoCreateTable(false)
    .create();

export default Alexa;
