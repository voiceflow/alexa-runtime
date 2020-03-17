import { EventType, State } from '@voiceflow/client';
import { IntentRequest as AlexaIntentRequest } from 'ask-sdk-model';

import { T, TEST_VERSION_ID } from '@/lib/constants';
import { RequestType } from '@/lib/services/voiceflow/types';

import { AbstractManager } from '../utils';
import { addBlockTrace } from './utils';

type Request = { type: RequestType; payload: AlexaIntentRequest };

class TestManager extends AbstractManager {
  async invoke(state: State, request?: Request) {
    const { voiceflow } = this.services;

    const context = voiceflow.createContext(TEST_VERSION_ID, state as State, request, {
      endpoint: `${this.config?.VF_DATA_ENDPOINT}/test`,
    });

    context.setEvent(EventType.handlerWillHandle, (event) => addBlockTrace(event.context, event.block.blockID));

    context.turn.set(T.REQUEST, request);

    await context.update();

    return {
      ...context.getRawState(),
      trace: context.getTrace(),
    };
  }
}

export default TestManager;
