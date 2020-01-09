import ASK from 'ask-sdk';

import { ServiceMap } from '..';
import Handlers from './handlers';

function Alexa(services: ServiceMap) {
  const LaunchHandler = new Handlers.LaunchHandler(services);
  const IntentHandler = new Handlers.IntentHandler(services);

  return (
    ASK.SkillBuilders.standard()
      .addRequestHandlers(LaunchHandler, IntentHandler)
      .addErrorHandlers(errorHandler)
      // .addRequestInterceptors(RequestInterceptor)
      .addResponseInterceptors(ResponseInterceptor)
      .withTableName(process.env.SESSIONS_DYNAMO_TABLE)
      .withAutoCreateTable(false)
      .create()
  );
}

export default Alexa;
