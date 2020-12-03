import { BlockTraceFrame, TraceType } from '@voiceflow/general-types';
import { TraceFrame as ExitTraceFrame } from '@voiceflow/general-types/build/nodes/exit';
import { TraceFrame as StreamTraceFrame, TraceStreamAction } from '@voiceflow/general-types/build/nodes/stream';
import { EventType, State } from '@voiceflow/runtime';
import { IntentRequest as AlexaIntentRequest } from 'ask-sdk-model';

import { S, T, TEST_VERSION_ID, V } from '@/lib/constants';
import { StreamAction, StreamPlay } from '@/lib/services/voiceflow/handlers/stream';
import { RequestType } from '@/lib/services/voiceflow/types';

import { Config, Services } from '../utils';
import Handlers from './handlers';

type Request = { type: RequestType; payload: AlexaIntentRequest };

const utilsObj = {
  Handlers,
};

const TestManager = (services: Services, config: Config, utils = utilsObj) => {
  const handlers = utils.Handlers(config);

  const invoke = async (state: State, request?: Request) => {
    const { voiceflow, prototypeDataAPI } = services;

    const context = voiceflow.client.createContext(TEST_VERSION_ID, state as State, request, {
      api: prototypeDataAPI,
      handlers,
    });

    context.setEvent(EventType.handlerWillHandle, (event) =>
      context.trace.addTrace<BlockTraceFrame>({
        type: TraceType.BLOCK,
        payload: { blockID: event.node.id },
      })
    );

    context.turn.set(T.REQUEST, request);
    context.variables.set(V.TIMESTAMP, Math.floor(Date.now() / 1000));

    await context.update();

    const stream = context.storage.get(S.STREAM_PLAY) as StreamPlay | undefined;

    if (stream) {
      const { action, url, token, loop } = stream;
      switch (action) {
        case StreamAction.START:
        case StreamAction.RESUME:
          context.trace.addTrace<StreamTraceFrame>({
            type: TraceType.STREAM,
            payload: { src: url, token, action: loop ? TraceStreamAction.LOOP : TraceStreamAction.PLAY },
          });
          break;
        case StreamAction.PAUSE:
          context.trace.addTrace<StreamTraceFrame>({
            type: TraceType.STREAM,
            payload: { src: url, token, action: TraceStreamAction.PAUSE },
          });
          break;
        default:
          break;
      }
    }

    if (context.stack.isEmpty() || context.turn.get(T.END)) {
      context.trace.addTrace<ExitTraceFrame>({ type: TraceType.END });
    }

    return {
      ...context.getRawState(),
      trace: context.trace.get(),
    };
  };

  return { invoke };
};

export default TestManager;
