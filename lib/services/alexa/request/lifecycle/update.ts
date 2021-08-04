import { RepeatType } from '@voiceflow/general-types';

import { Event, RequestType } from '@/lib/clients/ingest-client';
import { S, T, V } from '@/lib/constants';
import { AlexaRuntime } from '@/lib/services/runtime/types';
import logger from '@/logger';

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
  try {
    // Track response on analytics system
    const turnID = await runtime.services.analyticsClient.track({
      id: runtime.getVersionID(),
      event: Event.TURN,
      request: input?.requestEnvelope?.request?.type === 'LaunchRequest' ? RequestType.LAUNCH : RequestType.REQUEST,
      payload: runtime.getRequest(),
      sessionid: input.requestEnvelope.session?.sessionId,
      metadata: runtime.getFinalState(),
      timestamp: new Date(),
    });
    turn.set(T.TURNID, turnID);
  } catch (error) {
    logger.error(error);
  }
};

export default update;
