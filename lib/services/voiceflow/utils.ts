import { extractFrameCommand, Frame, Store } from '@voiceflow/client';
import { Slot } from 'ask-sdk-model';

import { T } from '@/lib/constants';

import { Context, Mapping } from './types';

const _replacer = (match: string, inner: string, variables: Record<string, any>, modifier?: Function) => {
  if (inner in variables) {
    return typeof modifier === 'function' ? modifier(variables[inner]) : variables[inner];
  }
  return match;
};

export const regexVariables = (phrase: string, variables: Record<string, any>, modifier?: Function) => {
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

export const mapSlots = (mappings: Mapping[], slots: { [key: string]: Slot }, overwrite = false): object => {
  const variables = {};
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

export const addRepromptIfExists = (block: Record<string, any>, context: Context, variables: Store): void => {
  if (block.reprompt) context.turn.set(T.REPROMPT, regexVariables(block.reprompt, variables.getState()));
};

export const findAlexaCommand = (intentName: string, context: Context): { nextId: string; variableMap: Mapping[] } => {
  let nextId: string;
  let variableMap: Mapping[];

  if (intentName === 'VoiceFlowIntent') return null;

  const matcher = (command) => command?.intent === intentName;

  // If AMAZON.CancelIntent is not handled turn it into AMAZON.StopIntent
  // This first loop is AMAZON specific, if cancel intent is not explicitly used anywhere at all, map it to stop intent
  if (intentName === 'AMAZON.CancelIntent') {
    const found = context.stack.getFrames().some((frame) => frame.getCommands().some(matcher));
    if (!found) intentName = 'AMAZON.StopIntent';
  }

  const { index, command } = extractFrameCommand(context.stack, matcher);
  if (command) {
    variableMap = command.mappings;

    if (command.diagram_id) {
      // Reset state to beginning of new diagram and store current line to the stack
      // TODO: use last_speak
      const newFrame = new Frame({ diagramID: command.diagram_id });
      context.stack.push(newFrame);
    } else if (command.next) {
      if (command.return) {
        // Reset state to beginning of new diagram and store current line to the stack
        // TODO: use last_speak
        context.stack.push(context.stack.get(index));
        context.stack.top().setBlockID(command.next);
      } else if (index < context.stack.getSize() - 1) {
        // otherwise destructive and pop off everything before the command
        context.stack.popTo(index + 1);
        context.stack.top().setBlockID(command.next);
      } else if (index === context.stack.getSize() - 1) {
        // jumping to an intent within the same flow
        nextId = command.next;
      }
    }
  }

  if (!(nextId || context.hasEnded())) return null;

  return { nextId, variableMap };
};
