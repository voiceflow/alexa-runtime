import { BaseNode } from '@voiceflow/base-types';
import { getVersionDefaultVoice } from '@voiceflow/general-runtime/build/lib/services/runtime/handlers/utils/version';
import { HandlerFactory } from '@voiceflow/general-runtime/build/runtime';
import { VoiceNode } from '@voiceflow/voice-types';

import { addOutput } from '@/lib/services/runtime/handlers/utils/output';
import { promptToSSML } from '@/lib/services/runtime/programs/resume';

import { fetchPrompt } from './utils/ai';

const AIResponseHandler: HandlerFactory<VoiceNode.AIResponse.Node> = () => ({
  canHandle: (node) => node.type === BaseNode.NodeType.AI_RESPONSE,
  handle: async (node, runtime, variables) => {
    const nextID = node.nextId ?? null;

    const response = await fetchPrompt(node, variables);

    if (!response) return nextID;

    const output = promptToSSML(response, node.voice ?? getVersionDefaultVoice(runtime.version));

    addOutput(output, runtime, { addToTop: true });

    return nextID;
  },
});

export default AIResponseHandler;
