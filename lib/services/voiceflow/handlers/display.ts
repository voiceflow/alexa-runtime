import { Handler } from '@voiceflow/client';
import { SupportedInterfaces } from 'ask-sdk-model';

import { S } from '@/lib/constants';
import { FullServiceMap } from '@/lib/services';
import { deepFind } from '@/lib/utils';

import { regexVariables } from '../utils';

export type Display = {
  nextId?: string;
  display_id?: number;
  datasource?: string;
  apl_commands?: object[];
  update_on_change?: boolean;
};

const getVariables = (str: string): string[] => {
  return (str.match(/\{[\w\d]+\}/g) || []).map((s) => s.slice(1, -1));
};

const EVENT_SEND_EVENT = 'SendEvent';
const APL_INTERFACE_NAME = 'Alexa.Presentation.APL';
const DOCUMENT_VIDEO_TYPE = 'Video';
const VOICEFLOW_VIDEO_ENDED = 'voiceflowVideoEnded';

const DisplayHandler: Handler<Display> = {
  canHandle: (block) => {
    return !!block.display_id;
  },
  handle: async (block, context, variables) => {
    const supportedInterfaces: SupportedInterfaces | undefined = context.storage.get(S.SUPPORTED_INTERFACES);
    const nextId = block.nextId ?? null;

    if (!supportedInterfaces || !supportedInterfaces[APL_INTERFACE_NAME]) {
      return nextId;
    }

    const services = context.services as FullServiceMap;
    const displayId = block.display_id as number;
    const datasource = block.datasource ?? '';

    const displayInfo = {
      commands: block.apl_commands,
      datasource: regexVariables(datasource, variables.getState()),
      should_update: true,
      current_display: displayId,
      last_datasource: datasource,
      datasource_variables: block.update_on_change ? getVariables(datasource) : null,
    };

    context.storage.set(S.DISPLAY_INFO, displayInfo);

    const document = await services.multimodal.getDisplayDocument(displayId);

    if (!document) {
      return nextId;
    }

    const results = deepFind(document, { type: DOCUMENT_VIDEO_TYPE });

    const on_end_events = results
      .map((result) => result.item.onEnd)
      .filter(Boolean)
      .map((event) => event.type === EVENT_SEND_EVENT && event.arguments?.includes(VOICEFLOW_VIDEO_ENDED));

    if (on_end_events?.length > 0) {
      context.storage.set(S.AWAITING_VIDEO_ENDED_EVENT, true); // APL videoEnded event for Isobar
      context.storage.set(S.NEXT_ID, block.nextId); // Advance line and leave skill

      return null;
    }

    return nextId;
  },
};

export default DisplayHandler;
