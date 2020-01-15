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

export const findCommand = (context: Context) => {
  let nextId: string;

  const reqPayload = context.getRequest().payload;

  if (reqPayload.get(R.INTENT).name === 'VoiceFlowIntent') return null;

  // If AMAZON.CancelIntent is not handled turn it into AMAZON.StopIntent
  // This first loop is AMAZON specific
  if (reqPayload.get(R.INTENT).name === 'AMAZON.CancelIntent') {
    const found = context.stack
      .getFrames()
      .reverse()
      .some((frame) => {
        if (reqPayload.get(R.INTENT).name in frame.getRequests()) return true;

        return false;
      });

    if (!found) reqPayload.set(R.INTENT, { ...reqPayload.get(R.INTENT), name: 'AMAZON.StopIntent' });
  }

  const intentName = reqPayload.get(R.INTENT).name;

  context.stack
    .getFrames()
    .reverse()
    .some((frame) => {
      // This can only be true if intentName is number. Get's transformed into number by transformInput in old server code
      if (intentName in frame.getRequests()) {
        // request = command in old server code
        const request = frame.getRequests()[intentName];

        if (Array.isArray(request.mappings)) {
          reqPayload.set(R.MAPPINGS, request.mappings);
        }

        // TODO: Ensure diagram doesn't get popped off the stack since there is no more line

        // if (request.diagram_id) {
        //   // TODO
        // } else if (request.next) {
        //   // TODO
        // }

        return true;
      }

      return false;
    });

  return nextId;
};
