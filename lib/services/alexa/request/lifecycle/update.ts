import { RepeatType } from '@voiceflow/general-types';

import { Event } from '@/lib/clients/ingest-client';
import { S, T, V } from '@/lib/constants';
import { AlexaRuntime } from '@/lib/services/runtime/types';

import { AlexaHandlerInput } from '../../types';

const update = async (runtime: AlexaRuntime, input: AlexaHandlerInput): Promise<void> => {
  const { turn, variables, storage } = runtime;

  const repeatNumber = storage?.get(S.REPEAT);

  // TODO: temporary buffer to update sessions with old numeric repeat type REMOVE SOON
  if (typeof repeatNumber === 'number') {
    let repeat = RepeatType.ALL;
    if (repeatNumber === 0) repeat = RepeatType.OFF;
    else if (repeatNumber < 100) repeat = RepeatType.DIALOG;
    storage.set(S.REPEAT, repeat);
  }
  turn.set(T.REQUEST, runtime.getRequest());
  variables.set(V.TIMESTAMP, Math.floor(Date.now() / 1000));

  await runtime.update();

  // Track response on analytics system
  if (runtime?.services?.analyticsClient) {
    runtime.services.analyticsClient.track(
      runtime.getVersionID(),
      Event.INTERACT,
      true,
      runtime.getRequest(),
      input.requestEnvelope.session?.sessionId,
      runtime.getFinalState()
    );
  }
};

export default update;
