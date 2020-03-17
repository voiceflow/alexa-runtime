import { EventType, State } from '@voiceflow/client';
import { IntentRequest as AlexaIntentRequest } from 'ask-sdk-model';

import { T, TEST_VERSION_ID } from '@/lib/constants';
import { injectServices } from '@/lib/services/types';
import { RequestType } from '@/lib/services/voiceflow/types';

import { AbstractManager } from '../utils';
import { addBlockTrace } from './utils';

type Request = { type: RequestType; payload: AlexaIntentRequest };

const utilsObj = {
  addBlockTrace,
};

@injectServices({ utils: utilsObj })
class TestManager extends AbstractManager<{ utils: typeof utilsObj }> {
  async invoke(state: State, request?: Request) {
    const { voiceflow, utils } = this.services;

    const context = voiceflow.client().createContext(TEST_VERSION_ID, state as State, request, {
      endpoint: `${this.config.VF_DATA_ENDPOINT}/test`,
    });

    context.setEvent(EventType.handlerWillHandle, (event) => utils.addBlockTrace(event.context, event.block.blockID));

    context.turn.set(T.REQUEST, request);

    await context.update();

    return {
      ...context.getRawState(),
      trace: context.getTrace(),
    };
  }
}

export default TestManager;
