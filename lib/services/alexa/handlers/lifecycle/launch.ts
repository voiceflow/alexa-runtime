import { Context, Frame } from '@voiceflow/client';
import { HandlerInput } from 'ask-sdk';

import { S } from '@/lib/constants';

import { SkillMetadata } from '../../types';

const launch = async (context: Context, input: HandlerInput): Promise<void> => {
  // fetch the metadata for this version (project)
  const meta = (await context.fetchMetadata()) as SkillMetadata;

  const { stack, storage, variables } = context;

  // increment user sessions by 1 or initialize
  if (!storage.get(S.SESSIONS)) {
    storage.set(S.SESSIONS, 1);
  } else {
    storage.produce((draft) => {
      draft[S.SESSIONS] += 1;
    });
  }

  // set based on input
  storage.set(S.LOCALE, input.requestEnvelope.request.locale);
  storage.set(S.USER, input.requestEnvelope.context.System.user.userId);

  // set based on metadata
  storage.set(S.ALEXA_PERMISSIONS, meta.alexa_permissions ?? []);
  storage.set(S.REPEAT, meta.repeat ?? 100);

  // default global variables
  variables.merge({
    timestamp: Math.floor(Date.now() / 1000),
    locale: storage.get(S.LOCALE),
    user_id: storage.get(S.USER),
    sessions: storage.get(S.SESSIONS),
    platform: 'alexa',

    // hidden system variables (code block only)
    voiceflow: {
      // TODO: implement all exposed voiceflow variables
      permissions: storage.get(S.ALEXA_PERMISSIONS),
      events: [],
    },
    _system: input.requestEnvelope.context.System,
  });

  // initialize all the global variables
  variables.initialize(meta.global, 0);

  if (stack.isEmpty()) {
    stack.push(new Frame({ diagramID: meta.diagram }));
  }
};

export default launch;
