import { State } from '@voiceflow/general-runtime/build/runtime';

import { AlexaRuntime } from '@/lib/services/runtime/types';

import { AlexaHandlerInput } from './types';

export const updateRuntime = async (input: AlexaHandlerInput, produce: (runtime: AlexaRuntime) => Promise<void> | void) => {
  const { versionID, runtimeClient } = input.context;

  const rawState = await input.attributesManager.getPersistentAttributes();

  const runtime = runtimeClient.createRuntime(versionID, rawState as State);

  await produce(runtime);

  input.attributesManager.setPersistentAttributes(runtime.getRawState());
};
