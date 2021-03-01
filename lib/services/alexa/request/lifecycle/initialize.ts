import { RepeatType, SessionType, TraceType } from '@voiceflow/general-types';
import { SpeakType, TraceFrame as SpeakTraceFrame } from '@voiceflow/general-types/build/nodes/speak';
import { Frame, Store } from '@voiceflow/runtime';

import { F, S, T, V } from '@/lib/constants';
import { StreamAction } from '@/lib/services/runtime/handlers/stream';
import { createResumeFrame, RESUME_PROGRAM_ID } from '@/lib/services/runtime/programs/resume';
import { AlexaRuntime } from '@/lib/services/runtime/types';

import { AlexaHandlerInput } from '../../types';

export const VAR_VF = 'voiceflow';

const utilsObj = {
  resume: {
    createResumeFrame,
    RESUME_PROGRAM_ID,
  },
  client: {
    Frame,
    Store,
  },
};

export const initializeGenerator = (utils: typeof utilsObj) => async (runtime: AlexaRuntime, input: AlexaHandlerInput): Promise<void> => {
  const { requestEnvelope } = input;

  // fetch the metadata for this version (project)
  const {
    platformData: { settings, slots },
    variables: versionVariables,
    rootDiagramID,
  } = await runtime.api.getVersion(runtime.getVersionID());

  const { stack, storage, variables } = runtime;

  storage.delete(S.STREAM_TEMP);

  // increment user sessions by 1 or initialize
  if (!storage.get(S.SESSIONS)) {
    storage.set(S.SESSIONS, 1);
  } else {
    storage.produce((draft) => {
      draft[S.SESSIONS] += 1;
    });
  }

  // set based on input
  storage.set(S.LOCALE, requestEnvelope.request.locale);
  storage.set(S.USER, requestEnvelope.context.System.user.userId);
  storage.set(S.SUPPORTED_INTERFACES, requestEnvelope.context.System.device?.supportedInterfaces);

  // set based on metadata
  storage.set(S.ALEXA_PERMISSIONS, settings.permissions ?? []);
  storage.set(S.REPEAT, settings.repeat ?? RepeatType.ALL);

  // default global variables
  variables.merge({
    [V.TIMESTAMP]: 0,
    locale: storage.get(S.LOCALE),
    user_id: storage.get(S.USER),
    sessions: storage.get(S.SESSIONS),
    platform: 'alexa',

    // hidden system variables (code node only)
    [VAR_VF]: {
      // TODO: implement all exposed voiceflow variables
      permissions: storage.get(S.ALEXA_PERMISSIONS),
      capabilities: storage.get(S.SUPPORTED_INTERFACES),
      events: [],
    },
    _system: input.requestEnvelope.context.System,
  });

  // initialize all the global variables, as well as slots as global variables
  utils.client.Store.initialize(variables, versionVariables, 0);
  utils.client.Store.initialize(
    variables,
    slots.map((slot) => slot.name),
    0
  );

  // end any existing stream
  if (storage.get(S.STREAM_PLAY)) {
    storage.produce((draft) => {
      draft[S.STREAM_PLAY].action = StreamAction.END;
    });
  }

  const { session = { type: SessionType.RESTART } } = settings;
  // restart logic
  const shouldRestart = stack.isEmpty() || session.type === SessionType.RESTART || variables.get<{ resume?: boolean }>(VAR_VF)?.resume === false;
  if (shouldRestart) {
    // start the stack with just the root flow
    stack.flush();
    stack.push(new utils.client.Frame({ programID: rootDiagramID }));

    // we've created a brand new stack
    runtime.turn.set(T.NEW_STACK, true);
  } else if (session.type === SessionType.RESUME && session.resume) {
    // resume prompt flow - use command flow logic
    stack.top().storage.set(F.CALLED_COMMAND, true);

    // if there is an existing resume flow, remove itself and anything above it
    const resumeStackIndex = stack.getFrames().findIndex((frame) => frame.getProgramID() === utils.resume.RESUME_PROGRAM_ID);
    if (resumeStackIndex >= 0) {
      stack.popTo(resumeStackIndex);
    }

    stack.push(utils.resume.createResumeFrame(session.resume, session.follow));
  } else {
    // give runtime to where the user left off with last speak node
    stack.top().storage.delete(F.CALLED_COMMAND);
    const lastSpeak = stack.top().storage.get<string>(F.SPEAK) ?? '';

    storage.set(S.OUTPUT, lastSpeak);
    runtime.trace.addTrace<SpeakTraceFrame>({
      type: TraceType.SPEAK,
      payload: { message: lastSpeak, type: SpeakType.MESSAGE },
    });
  }
};

export default initializeGenerator(utilsObj);
