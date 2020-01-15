import { Context, Mapping, Store } from '@voiceflow/client';

import { R, T } from '@/lib/constants';

const _replacer = (match: string, inner: string, variables: Record<string, any>, modifier?: Function) => {
  if (inner in variables) {
    return typeof modifier === 'function' ? modifier(variables[inner]) : variables[inner];
  }
  return match;
};

const _regexVariables = (phrase: string, variables: Record<string, any>, modifier?: Function) => {
  if (!phrase || !phrase.trim()) return '';

  return phrase.replace(/\{([a-zA-Z0-9_]{1,32})\}/g, (match, inner) => _replacer(match, inner, variables, modifier));
};

const _stringToNumIfNumeric = (str: string): number | string => {
  const number = Number(str);
  return Number.isNaN(number) ? str : number;
};

export const formatName = (name: string): string => {
  if (!name) return name;

  let formattedName = '';
  // replace white spaces with underscores
  formattedName = name.replace(/ /g, '_');
  // replace numbers with equivalent capital letter. Ex: 0 = A, 1 = B
  formattedName = formattedName.replace(/\d/g, (digit) => {
    return String.fromCharCode(parseInt(digit, 10) + 65);
  });
  return formattedName;
};

export const mapVariables = (context: Context, variables: Store, overwrite = false) => {
  const { payload: reqPayload } = context.getRequest();

  const mappings = reqPayload.get(R.MAPPINGS);
  const { slots } = reqPayload.get(R.INTENT);

  if (mappings && slots) {
    mappings.forEach((map: Mapping) => {
      if (!map.slot) return;

      const toVariable = map.variable;
      const fromSlot = formatName(map.slot);

      // extract slot value from request
      const fromSlotValue = slots[fromSlot]?.resolutions?.resolutionsPerAuthority?.[0].values?.[0].value?.name || slots[fromSlot]?.value || null;

      if (toVariable && (fromSlotValue || overwrite)) {
        variables.set(toVariable, _stringToNumIfNumeric(fromSlotValue));
      }
    });
  }

  // mappings have been processed. can be deleted from request
  reqPayload.delete(R.MAPPINGS);
};

export const addRepromptIfExists = (block: Record<string, any>, context: Context, variables: Store): void => {
  if (block.reprompt) context.turn.set(T.REPROMPT, _regexVariables(block.reprompt, variables.getState()));
};
