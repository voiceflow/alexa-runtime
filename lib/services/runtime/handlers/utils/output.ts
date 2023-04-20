import { BaseNode } from '@voiceflow/base-types';
import AIAssist, { AIAssistLog } from '@voiceflow/general-runtime/build/lib/services/aiAssist';
import { Runtime } from '@voiceflow/general-runtime/build/runtime';

import { F, S } from '@/lib/constants';

import { AlexaRuntimeRequest, RequestType } from '../../types';

const MAX_TURNS = 5;

export const addOutput = (output: string, runtime: Runtime, options: { addToTop?: boolean } = {}) => {
  const { storage, trace, variables } = runtime;
  storage.produce((draft) => {
    draft[S.OUTPUT] += output;
  });

  if (options.addToTop) runtime.stack.top().storage.set(F.SPEAK, output);

  trace.addTrace<BaseNode.Speak.TraceFrame>({
    type: BaseNode.Utils.TraceType.SPEAK,
    payload: { message: output, type: BaseNode.Speak.TraceSpeakType.MESSAGE },
  });

  // add output to transcript
  const transcript = (variables.get(AIAssist.StorageKey) as AIAssistLog) || [];
  const lastTranscript = transcript[transcript.length - 1];

  if (lastTranscript?.role === 'assistant') {
    lastTranscript.content += `\n${output}`;
  } else {
    transcript.push({ role: 'assistant', content: output });
    if (transcript.length > MAX_TURNS) transcript.shift();
  }
  variables.set(AIAssist.StorageKey, transcript);
};

export const addInput = (request: AlexaRuntimeRequest | null, runtime: Runtime) => {
  const transcript: AIAssistLog = runtime.variables.get(AIAssist.StorageKey) || [];

  let input: string | undefined;
  if (request?.type === RequestType.INTENT) {
    // capture step
    const querySlot = request.payload.intent.slots?.query_slot;
    if (querySlot) {
      input = querySlot.value;
    } else {
      input = `Intent: ${request.payload.intent.name}`;

      const slots = Object.fromEntries(
        Object.entries(request.payload.intent.slots || {})
          .map(([key, value]) => [key, value?.value])
          .filter(([, value]) => !!value)
      );
      if (Object.keys(slots).length) input += `\nSlots: ${JSON.stringify(slots)}`;
    }
  }

  if (input) {
    if (transcript.length > MAX_TURNS) transcript.shift();
    transcript.push({ role: 'user', content: input });
  }

  runtime.variables.set(AIAssist.StorageKey, transcript);
};
