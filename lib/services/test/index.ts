import { TraceType } from '@voiceflow/general-types';
import { TraceFrame as ExitTraceFrame } from '@voiceflow/general-types/build/nodes/exit';
import { TraceFrame as StreamTraceFrame, TraceStreamAction } from '@voiceflow/general-types/build/nodes/stream';
import { EventType, State } from '@voiceflow/runtime';
import { IntentRequest as AlexaIntentRequest } from 'ask-sdk-model';

import { S, T, TEST_VERSION_ID, V } from '@/lib/constants';
import { StreamAction, StreamPlay } from '@/lib/services/runtime/handlers/stream';
import { RequestType } from '@/lib/services/runtime/types';

import { Config, Services } from '../utils';
import Handlers from './handlers';

type Request = { type: RequestType; payload: AlexaIntentRequest };

const utilsObj = {
  Handlers,
};

const TestManager = (services: Services, config: Config, utils = utilsObj) => {
  const handlers = utils.Handlers(config);

  const invoke = async (state: State, request?: Request) => {
    const { runtimeClient, prototypeDataAPI } = services;

    const runtime = runtimeClient.createRuntime(TEST_VERSION_ID, state as State, request, {
      api: prototypeDataAPI,
      handlers,
    });

    runtime.setEvent(EventType.handlerWillHandle, (event) =>
      runtime.trace.addTrace({
        type: TraceType.BLOCK,
        payload: { blockID: event.node.id },
      })
    );

    runtime.turn.set(T.REQUEST, request);
    runtime.variables.set(V.TIMESTAMP, Math.floor(Date.now() / 1000));

    await runtime.update();

    const stream = runtime.storage.get(S.STREAM_PLAY) as StreamPlay | undefined;

    if (stream) {
      const { action, url, token, loop } = stream;
      switch (action) {
        case StreamAction.START:
        case StreamAction.RESUME:
          runtime.trace.addTrace<StreamTraceFrame>({
            type: TraceType.STREAM,
            payload: { src: url, token, action: loop ? TraceStreamAction.LOOP : TraceStreamAction.PLAY },
          });
          break;
        case StreamAction.PAUSE:
          runtime.trace.addTrace<StreamTraceFrame>({
            type: TraceType.STREAM,
            payload: { src: url, token, action: TraceStreamAction.PAUSE },
          });
          break;
        default:
          break;
      }
    }

    if (runtime.stack.isEmpty() || runtime.turn.get(T.END)) {
      runtime.trace.addTrace<ExitTraceFrame>({ type: TraceType.END });
    }

    return {
      ...runtime.getRawState(),
      trace: runtime.trace.get(),
    };
  };

  return { invoke };
};

export default TestManager;
