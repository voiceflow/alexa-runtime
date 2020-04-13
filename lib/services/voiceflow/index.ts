import Client, { EventType } from '@voiceflow/client';

import { F, S, TEST_VERSION_ID } from '@/lib/constants';
import { RESUME_DIAGRAM_ID, ResumeDiagram } from '@/lib/services/voiceflow/diagrams/resume';
import { executeEvents } from '@/lib/services/voiceflow/handlers/events';

import { Config, Services } from '../utils';
import Handlers from './handlers';

const utilsObj = {
  Client,
  resume: {
    ResumeDiagram,
    RESUME_DIAGRAM_ID,
  },
  Handlers,
  executeEvents,
};

const VoiceflowManager = (services: Services, config: Config, utils = utilsObj) => {
  const handlers = utils.Handlers(config);

  const client = new utils.Client({
    secret: services.secretsProvider.get('VF_DATA_SECRET'),
    endpoint: config.VF_DATA_ENDPOINT,
    services,
    handlers,
  });

  client.setEvent(EventType.traceWillAdd, ({ context, stop }) => {
    if (context.versionID !== TEST_VERSION_ID) stop();
  });

  client.setEvent(EventType.stackDidChange, ({ context }) => {
    const diagramID = context.stack.top()?.getDiagramID();

    context.trace.flow(diagramID);
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

  client.setEvent(EventType.diagramWillFetch, ({ diagramID, override }) => {
    if (diagramID === utils.resume.RESUME_DIAGRAM_ID) {
      override(utils.resume.ResumeDiagram);
    }
  });

  client.setEvent(EventType.stateDidExecute, utils.executeEvents(EventType.stateDidExecute));

  return { client };
};

export default VoiceflowManager;
