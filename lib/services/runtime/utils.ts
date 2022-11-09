import { BaseModels, Nullable } from '@voiceflow/base-types';
import { formatIntentName, replaceVariables, transformStringVariableToNumber } from '@voiceflow/common';
import { Runtime, Store } from '@voiceflow/general-runtime/build/runtime';
import { VoiceNode } from '@voiceflow/voice-types';
import { Slot } from 'ask-sdk-model';
import _ from 'lodash';

import { T } from '@/lib/constants';

import { isPrompt } from './types';

const ALEXA_AUTHORITY = 'AlexaEntities';

export const mapSlots = ({
  slots,
  mappings,
  overwrite = false,
}: {
  slots: { [key: string]: Slot };
  mappings: BaseModels.SlotMapping[];
  overwrite?: boolean;
}): Record<string, any> => {
  const variables: Record<string, any> = {};

  if (mappings && slots) {
    mappings.forEach((map: BaseModels.SlotMapping) => {
      if (!map.slot) return;

      const toVariable = map.variable;
      const fromSlot = formatIntentName(map.slot);

      const resolution = slots[fromSlot]?.resolutions?.resolutionsPerAuthority?.[0];
      const fromSlotValue =
        (resolution?.authority !== ALEXA_AUTHORITY && resolution?.values?.[0].value?.name) ||
        slots[fromSlot]?.value ||
        null;

      if (toVariable && (fromSlotValue || overwrite)) {
        variables[toVariable] = transformStringVariableToNumber(fromSlotValue);
      }
    });
  }

  return variables;
};

export interface RepromptNode {
  reprompt?: string;
  noReply?: Nullable<VoiceNode.Utils.NodeNoReply>;
}

const convertDeprecatedReprompt = <B extends RepromptNode>(node: B) => ({
  ...node,
  noReply: {
    ...node.noReply,
    prompts: node.noReply?.prompts || (node.reprompt ? [node.reprompt] : []),
  },
});

export const getGlobalNoMatchPrompt = (runtime: Runtime) => {
  const { version } = runtime;
  return isPrompt(version?.platformData.settings?.globalNoMatch?.prompt)
    ? version?.platformData.settings?.globalNoMatch?.prompt
    : null;
};

const getGlobalNoReplyPrompt = (runtime: Runtime) => {
  const { version } = runtime;
  return isPrompt(version?.platformData?.settings.globalNoReply?.prompt)
    ? version?.platformData?.settings.globalNoReply?.prompt
    : null;
};

export const addRepromptIfExists = <B extends RepromptNode>({
  node,
  runtime,
  variables,
}: {
  node: B;
  runtime: Runtime;
  variables: Store;
}): void => {
  const noReplyNode = convertDeprecatedReprompt(node);
  const content = noReplyNode.noReply.prompts?.length
    ? _.sample(noReplyNode.noReply.prompts)
    : getGlobalNoReplyPrompt(runtime)?.content;

  if (content) {
    runtime.turn.set(T.REPROMPT, replaceVariables(content, variables.getState()));
  }
};
