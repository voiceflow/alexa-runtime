import { BaseUtils } from '@voiceflow/base-types';
import { replaceVariables, sanitizeVariables } from '@voiceflow/common';
import AIAssist, { AIAssistLog } from '@voiceflow/general-runtime/build/lib/services/aiAssist';
import { Store } from '@voiceflow/general-runtime/build/runtime';
import axios from 'axios';

import Config from '@/config';
import log from '@/logger';

const logError = (error: Error) => {
  log.error(error);
  return null;
};

export const fetchPrompt = async (
  params: BaseUtils.ai.AIModelParams & { mode: BaseUtils.ai.PROMPT_MODE; prompt: string },
  variables: Store
) => {
  if (!Config.ML_GATEWAY_PORT) {
    log.error('ML_GATEWAY_PORT is not set, skipping generative node');
    return null;
  }

  const ML_GATEWAY_ENDPOINT = Config.ML_GATEWAY_PORT.split('/api')[0];

  const sanitizedVars = sanitizeVariables(variables.getState());

  const system = replaceVariables(params.system, sanitizedVars);
  const prompt = replaceVariables(params.prompt, sanitizedVars);
  const { mode, maxTokens, temperature, model } = params;

  let response: string | null = null;

  if (mode === BaseUtils.ai.PROMPT_MODE.MEMORY) {
    const messages = [...(variables.get<AIAssistLog>(AIAssist.StorageKey) || [])];
    if (system) messages.unshift({ role: 'system', content: system });

    response = await axios
      .post<{ result: string }>(`${ML_GATEWAY_ENDPOINT}/api/v1/generation/chat`, {
        messages,
        maxTokens,
        temperature,
        model,
      })
      .then(({ data: { result } }) => result)
      .catch(logError);
  } else if (mode === BaseUtils.ai.PROMPT_MODE.MEMORY_PROMPT) {
    const messages = [...(variables.get<AIAssistLog>(AIAssist.StorageKey) || [])];
    if (system) messages.unshift({ role: 'system', content: system });
    messages.push({ role: 'system', content: prompt });

    response = await axios
      .post<{ result: string }>(`${ML_GATEWAY_ENDPOINT}/api/v1/generation/chat`, {
        messages,
        maxTokens,
        temperature,
        model,
      })
      .then(({ data: { result } }) => result)
      .catch(logError);
  } else {
    if (!prompt) return null;

    response = await axios
      .post<{ result: string }>(`${ML_GATEWAY_ENDPOINT}/api/v1/generation/generative-response`, {
        prompt,
        maxTokens,
        system,
        temperature,
        model,
      })
      .then(({ data: { result } }) => result)
      .catch(logError);
  }

  return response;
};
