import { HandlerFactory } from '@voiceflow/runtime';

import { T } from '@/lib/constants';

import { RequestType } from '../../types';
import CommandHandler from '../command';

const utilsObj = {
  commandHandler: CommandHandler(),
};

export const OneShotIntentHandler: HandlerFactory<any, typeof utilsObj> = (utils) => ({
  canHandle: (_, runtime) => {
    if (runtime.turn.get(T.NEW_STACK) && runtime.getRequest()?.type === RequestType.INTENT) {
      return utils.commandHandler.canHandle(runtime);
    }

    return false;
  },
  handle: (_, runtime, variables) => utils.commandHandler.handle(runtime, variables),
});

export default () => OneShotIntentHandler(utilsObj);
