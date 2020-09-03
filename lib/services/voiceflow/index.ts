import Client, { EventType } from '@voiceflow/client';

import { F, S, TEST_VERSION_ID } from '@/lib/constants';
import { executeEvents } from '@/lib/services/voiceflow/handlers/events';
import { RESUME_PROGRAM_ID, ResumeDiagram } from '@/lib/services/voiceflow/programs/resume';

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

const VoiceflowManager = (services: Services, config: Config, utils = utilsObj) => {
  const handlers = utils.Handlers(config);

  const client = new utils.Client({
    api: services.serverDataAPI,
    services,
    handlers,
  });

  client.setEvent(EventType.traceWillAdd, ({ context, stop }) => {
    if (context.versionID !== TEST_VERSION_ID) stop();
  });

  client.setEvent(EventType.stackDidChange, ({ context }) => {
    const programID = context.stack.top()?.getProgramID();

    context.trace.flow(programID);
  });

  client.setEvent(EventType.frameDidFinish, ({ context }) => {
    if (context.stack.top()?.storage.get(F.CALLED_COMMAND)) {
      context.stack.top().storage.delete(F.CALLED_COMMAND);

      const output = context.stack.top().storage.get(F.SPEAK);
      if (output) {
        context.storage.produce((draft) => {
          draft[S.OUTPUT] += output;
        });
        context.trace.speak(output);
      }
    }
  });

  client.setEvent(EventType.programWillFetch, ({ programID, override }) => {
    if (programID === utils.resume.RESUME_PROGRAM_ID) {
      override(utils.resume.ResumeDiagram);
    }
  });

  client.setEvent(EventType.stateDidExecute, utils.executeEvents(EventType.stateDidExecute));

  return { client };
};

export default VoiceflowManager;
