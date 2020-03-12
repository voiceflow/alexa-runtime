import { EventType, State } from '@voiceflow/client';

import { TEST_VERSION_ID } from '@/lib/constants';

import { AbstractManager } from '../utils';
import { addBlockTrace } from './utils';

class TestManager extends AbstractManager {
  async invoke(state: State) {
    const { voiceflow } = this.services;

    const context = voiceflow.createTestingContext(TEST_VERSION_ID, state as State);

    context.setEvent(EventType.handlerWillHandle, (event) => addBlockTrace(event.context, event.block.blockID));

    await context.update();

    return {
      ...context.getRawState(),
      trace: context.getTrace(),
    };
  }
}

export default TestManager;
