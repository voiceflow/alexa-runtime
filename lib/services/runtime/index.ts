import { TraceType } from '@voiceflow/general-types';
import { TraceFrame as FlowTraceFrame } from '@voiceflow/general-types/build/nodes/flow';
import { SpeakType, TraceFrame as SpeakTraceFrame } from '@voiceflow/general-types/build/nodes/speak';
import Client, { EventType } from '@voiceflow/runtime';

import { F, S } from '@/lib/constants';
import { executeEvents } from '@/lib/services/runtime/handlers/events';
import { RESUME_PROGRAM_ID, ResumeDiagram } from '@/lib/services/runtime/programs/resume';

import { Config, Services } from '../utils';
import Handlers from './handlers';

const utilsObj = {
  Client,
  resume: {
    ResumeDiagram,
    RESUME_PROGRAM_ID,
  },
  Handlers,
  executeEvents,
};

const RuntimeClientManager = (services: Services, config: Config, utils = utilsObj) => {
  const handlers = utils.Handlers(config);

  const client = new utils.Client({
    api: services.dataAPI,
    services,
    handlers,
  });

  client.setEvent(EventType.traceWillAdd, ({ stop }) => {
    stop();
  });

  client.setEvent(EventType.stackDidChange, ({ runtime }) => {
    const programID = runtime.stack.top()?.getProgramID();

    runtime.trace.addTrace<FlowTraceFrame>({
      type: TraceType.FLOW,
      payload: { diagramID: programID },
    });
  });

  client.setEvent(EventType.frameDidFinish, ({ runtime }) => {
    if (runtime.stack.top()?.storage.get(F.CALLED_COMMAND)) {
      runtime.stack.top().storage.delete(F.CALLED_COMMAND);

      const output = runtime.stack.top().storage.get<string>(F.SPEAK);

      if (output) {
        runtime.storage.produce((draft) => {
          draft[S.OUTPUT] += output;
        });

        runtime.trace.addTrace<SpeakTraceFrame>({
          type: TraceType.SPEAK,
          payload: { message: output, type: SpeakType.MESSAGE },
        });
      }
    }
  });

  client.setEvent(EventType.programWillFetch, ({ programID, override }) => {
    if (programID === utils.resume.RESUME_PROGRAM_ID) {
      override(utils.resume.ResumeDiagram);
    }
  });

  client.setEvent(EventType.stateDidExecute, utils.executeEvents(EventType.stateDidExecute));

  return client;
};

export default RuntimeClientManager;
