import { Context, Store } from '@voiceflow/client';
import { Slot } from 'ask-sdk-model';
import _ from 'lodash';

import { T } from '@/lib/constants';

import { Mapping } from '../voiceflow/types';

export const _replacer = (match: string, inner: string, variables: Record<string, any>, modifier?: Function) => {
  if (inner in variables) {
    return typeof modifier === 'function' ? modifier(variables[inner]) : variables[inner];
  }
  return match;
};

export const regexVariables = (phrase: string, variables: Record<string, any>, modifier?: Function) => {
  if (!phrase || !phrase.trim()) return '';

  return phrase.replace(/\{([a-zA-Z0-9_]{1,32})\}/g, (match, inner) => _replacer(match, inner, variables, modifier));
};

// turn float variables to 2 decimal places
export const sanitizeVariables = (variables: Record<string, any>) =>
  Object.entries(variables).reduce<Record<string, any>>((acc, [key, value]) => {
    if (_.isNumber(value) && !Number.isInteger(value)) {
      acc[key] = value.toFixed(2);
    } else {
      acc[key] = value;
    }

    return acc;
  }, {});

const _stringToNumIfNumeric = (str: string | null): number | string | null => {
  if (str?.startsWith('0')) return str;

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

export const mapSlots = (mappings: Mapping[], slots: { [key: string]: Slot }, overwrite = false): object => {
  const variables: Record<string, any> = {};

  if (mappings && slots) {
    mappings.forEach((map: Mapping) => {
      if (!map.slot) return;

      const toVariable = map.variable;
      const fromSlot = formatName(map.slot);

      // extract slot value from request
      const fromSlotValue = slots[fromSlot]?.resolutions?.resolutionsPerAuthority?.[0].values?.[0].value?.name || slots[fromSlot]?.value || null;

      if (toVariable && (fromSlotValue || overwrite)) {
        variables[toVariable] = _stringToNumIfNumeric(fromSlotValue);
      }
    });
  }

  return variables;
};

export const addRepromptIfExists = <B extends { reprompt?: string }>(block: B, context: Context, variables: Store): void => {
  if (block.reprompt) {
    context.turn.set(T.REPROMPT, regexVariables(block.reprompt, variables.getState()));
  }
};
