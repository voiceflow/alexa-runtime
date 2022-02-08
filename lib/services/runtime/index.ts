import { BaseNode } from '@voiceflow/base-types';
import Client, { EventType } from '@voiceflow/general-runtime/build/runtime';

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

    runtime.trace.addTrace<BaseNode.Flow.TraceFrame>({
      type: BaseNode.Utils.TraceType.FLOW,
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

        runtime.trace.addTrace<BaseNode.Speak.TraceFrame>({
          type: BaseNode.Utils.TraceType.SPEAK,
          payload: { message: output, type: BaseNode.Speak.TraceSpeakType.MESSAGE },
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
