import { HandlerFactory } from '@voiceflow/runtime';

import { T } from '@/lib/constants';

import { RequestType } from '../../types';
import CommandHandler from '../command';

const utilsObj = {
  commandHandler: CommandHandler(),
};

export const OneShotIntentHandler: HandlerFactory<any, typeof utilsObj> = (utils) => ({
  canHandle: (_, context) => {
    if (context.turn.get(T.NEW_STACK) && context.getRequest()?.type === RequestType.INTENT) {
      return utils.commandHandler.canHandle(context);
    }

    return false;
  },
  handle: (_, context, variables) => utils.commandHandler.handle(context, variables),
});

export default () => OneShotIntentHandler(utilsObj);
