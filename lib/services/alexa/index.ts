import ASK from 'ask-sdk';

import { FullServiceMap } from '..';
import { IntentHandler, LaunchHandler, AudioplayerHandler } from './handlers';
import { Config } from '@/types';

const ResponseInterceptor = {
  async process(handlerInput) {
    // save session attributes to persistent attributes
    await handlerInput.attributesManager.savePersistentAttributes();
  },
};

function Alexa(services: FullServiceMap, config: Config) {
  return (
    ASK.SkillBuilders.standard()
      .addRequestHandlers(LaunchHandler, IntentHandler, AudioplayerHandler)
      .addErrorHandlers(errorHandler)
      // .addRequestInterceptors(RequestInterceptor)
      .addResponseInterceptors(ResponseInterceptor)
      .withTableName(config.SESSIONS_DYNAMO_TABLE)
      .withAutoCreateTable(false)
      .create()
  );
}

export default Alexa;
