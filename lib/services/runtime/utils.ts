import { SlotMapping } from '@voiceflow/api-sdk';
import { formatIntentName, replaceVariables, transformStringVariableToNumber } from '@voiceflow/common';
import { Runtime, Store } from '@voiceflow/runtime';
import { Slot } from 'ask-sdk-model';
import _ from 'lodash';

import { T } from '@/lib/constants';

export const mapSlots = ({
  slots,
  mappings,
  overwrite = false,
}: {
  slots: { [key: string]: Slot };
  mappings: SlotMapping[];
  overwrite?: boolean;
}): object => {
  const variables: Record<string, any> = {};

  if (mappings && slots) {
    mappings.forEach((map: SlotMapping) => {
      if (!map.slot) return;

      const toVariable = map.variable;
      const fromSlot = formatIntentName(map.slot);

      // extract slot value from request
      const fromSlotValue = slots[fromSlot]?.resolutions?.resolutionsPerAuthority?.[0].values?.[0].value?.name || slots[fromSlot]?.value || null;

      if (toVariable && (fromSlotValue || overwrite)) {
        variables[toVariable] = transformStringVariableToNumber(fromSlotValue);
      }
    });
  }

  return variables;
};

export const addRepromptIfExists = <B extends { reprompt?: string }>({
  node,
  runtime,
  variables,
}: {
  node: B;
  runtime: Runtime;
  variables: Store;
}): void => {
  if (node.reprompt) {
    runtime.turn.set(T.REPROMPT, replaceVariables(node.reprompt, variables.getState()));
  }
};
