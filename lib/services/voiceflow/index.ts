import Client, { EventType } from '@voiceflow/client';

import { F, S, TEST_VERSION_ID } from '@/lib/constants';
import { RESUME_DIAGRAM_ID, ResumeDiagram } from '@/lib/services/voiceflow/diagrams/resume';
import { executeEvents } from '@/lib/services/voiceflow/handlers/events';
import { Config } from '@/types';

import { ServiceMap } from '..';
import { addSpeakTrace } from '../test/utils';
import handlers from './handlers';

const Voiceflow = (services: ServiceMap, config: Config) => {
  const client = new Client({
    secret: config.VF_DATA_SECRET,
    endpoint: config.VF_DATA_ENDPOINT,
    handlers,
    services,
  });

  client.setEvent(EventType.traceWillAdd, ({ context, stop }) => {
    if (context.versionID !== TEST_VERSION_ID) stop();
  });

  client.setEvent(EventType.frameDidFinish, ({ context }) => {
    if (context.stack.top()?.storage.get(F.CALLED_COMMAND)) {
      context.stack.top().storage.delete(F.CALLED_COMMAND);

      const output = context.stack.top().storage.get(F.SPEAK);
      if (output) {
        context.storage.produce((draft) => {
          draft[S.OUTPUT] += output;
        });
        addSpeakTrace(context, output);
      }
    }
  });

  client.setEvent(EventType.diagramWillFetch, ({ diagramID, override }) => {
    if (diagramID === RESUME_DIAGRAM_ID) {
      override(ResumeDiagram);
    }
  });

  client.setEvent(EventType.stateDidExecute, executeEvents(EventType.stateDidExecute));

  return client;
};

export default Voiceflow;
