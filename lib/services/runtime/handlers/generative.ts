import { BaseNode } from '@voiceflow/base-types';
import { replaceVariables, sanitizeVariables } from '@voiceflow/common';
import { getVersionDefaultVoice } from '@voiceflow/general-runtime/build/lib/services/runtime/handlers/utils/version';
import { HandlerFactory } from '@voiceflow/general-runtime/build/runtime';
import { VoiceNode } from '@voiceflow/voice-types';
import axios from 'axios';

import Config from '@/config';
import { F, S } from '@/lib/constants';
import { promptToSSML } from '@/lib/services/runtime/programs/resume';
import log from '@/logger';

const GenerativeHandler: HandlerFactory<VoiceNode.Generative.Node> = () => ({
  canHandle: (node) => node.type === BaseNode.NodeType.GENERATIVE,
  handle: async (node, runtime, variables) => {
    const nextID = node.nextId ?? null;

    if (!Config.ML_GATEWAY_PORT) {
      log.error('ML_GATEWAY_PORT is not set, skipping generative node');
      return nextID;
    }

    if (!node.prompt) return nextID;

    const generativeEndpoint = `${Config.ML_GATEWAY_PORT}/api/v1/generation/generative-response`;

    const sanitizedVars = sanitizeVariables(variables.getState());
    const prompt = replaceVariables(node.prompt, sanitizedVars);
    const { length, voice } = node;

    const response = await axios
      .post<{ result: string }>(generativeEndpoint, { prompt, length })
      .then(({ data: { result } }) => result)
      .catch((error) => {
        log.error(error);
        return null;
      });

    if (!response) return nextID;

    const output = promptToSSML(response, voice ?? getVersionDefaultVoice(runtime.version));

    runtime.storage.produce((draft) => {
      draft[S.OUTPUT] += output;
    });

    runtime.stack.top().storage.set(F.SPEAK, output);
    runtime.trace.addTrace<BaseNode.Speak.TraceFrame>({
      type: BaseNode.Utils.TraceType.SPEAK,
      payload: { message: output, type: BaseNode.Speak.TraceSpeakType.MESSAGE },
    });

    return nextID;
  },
});

export default GenerativeHandler;
