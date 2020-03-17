import Client, { EventType } from '@voiceflow/client';

import { F, S, TEST_VERSION_ID } from '@/lib/constants';
import { injectServices } from '@/lib/services/types';
import { RESUME_DIAGRAM_ID, ResumeDiagram } from '@/lib/services/voiceflow/diagrams/resume';
import { executeEvents } from '@/lib/services/voiceflow/handlers/events';

import { addFlowTrace, addSpeakTrace } from '../test/utils';
import { AbstractManager } from '../utils';
import handlers from './handlers';

const utilsObj = {
  Client,
  resume: {
    ResumeDiagram,
    RESUME_DIAGRAM_ID,
  },
  handlers,
  executeEvents,
  trace: {
    addFlowTrace,
    addSpeakTrace,
  },
};
@injectServices({ utils: utilsObj })
class VoiceflowManager extends AbstractManager<{ utils: typeof utilsObj }> {
  client(): Client {
    const { utils } = this.services;

    const client = new utils.Client({
      secret: this.services.secretsProvider.get('VF_DATA_SECRET'),
      endpoint: this.config.VF_DATA_ENDPOINT,
      handlers: utils.handlers,
      services: this.services,
    });

    client.setEvent(EventType.traceWillAdd, ({ context, stop }) => {
      if (context.versionID !== TEST_VERSION_ID) stop();
    });

    client.setEvent(EventType.stackDidChange, ({ context }) => {
      const diagramID = context.stack.top()?.getDiagramID();

      utils.trace.addFlowTrace(context, diagramID);
    });

    client.setEvent(EventType.frameDidFinish, ({ context }) => {
      if (context.stack.top()?.storage.get(F.CALLED_COMMAND)) {
        context.stack.top().storage.delete(F.CALLED_COMMAND);

        const output = context.stack.top().storage.get(F.SPEAK);
        if (output) {
          context.storage.produce((draft) => {
            draft[S.OUTPUT] += output;
          });
          utils.trace.addSpeakTrace(context, output);
        }
      }
    });

    client.setEvent(EventType.diagramWillFetch, ({ diagramID, override }) => {
      if (diagramID === utils.resume.RESUME_DIAGRAM_ID) {
        override(utils.resume.ResumeDiagram);
      }
    });

    client.setEvent(EventType.stateDidExecute, utils.executeEvents(EventType.stateDidExecute));

    return client;
  }
}

export default VoiceflowManager;
