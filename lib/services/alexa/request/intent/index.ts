import { RequestHandler } from 'ask-sdk';

import { AlexaHandlerInput, Request } from '../../types';
import { buildResponse, buildRuntime, initialize, update } from '../lifecycle';
import behavior from './behavior';

const utilsObj = {
  buildRuntime,
  initialize,
  update,
  buildResponse,
  behavior,
};

export const IntentHandlerGenerator = (utils: typeof utilsObj): RequestHandler => ({
  canHandle(input: AlexaHandlerInput): boolean {
    const { type } = input.requestEnvelope.request;

    return type === Request.INTENT;
  },
  async handle(input: AlexaHandlerInput) {
    const runtime = await utils.buildRuntime(input);

    const frama0 = runtime.stack.getFrames()[0].getState();
    console.log('WTF-1', { programID: frama0.programID, nodeID: frama0.nodeID });

    if (runtime.stack.isEmpty()) {
      await utils.initialize(runtime, input);
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const handler of utils.behavior) {
      if (handler.canHandle(input, runtime)) {
        return handler.handle(input, runtime);
      }
    }

    const frame = runtime.stack.getFrames()[0].getState();
    console.log('WTF', { programID: frame.programID, nodeID: frame.nodeID });

    await utils.update(runtime);

    return utils.buildResponse(runtime, input);
  },
});

export default IntentHandlerGenerator(utilsObj);
