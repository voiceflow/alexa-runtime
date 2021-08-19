import { Node } from '@voiceflow/alexa-types';
import { CommandMapping } from '@voiceflow/api-sdk';
import { Node as BaseNode } from '@voiceflow/base-types';
import { extractFrameCommand, Frame, Runtime, Store } from '@voiceflow/general-runtime/build/runtime';
import _ from 'lodash';

import { F, T } from '@/lib/constants';

import { IntentName, IntentRequest, RequestType } from '../types';
import { mapSlots } from '../utils';

export const getCommand = (runtime: Runtime, extractFrame: typeof extractFrameCommand) => {
  const request = runtime.turn.get<IntentRequest>(T.REQUEST);

  if (request?.type !== RequestType.INTENT) return null;

  const { intent } = request.payload;
  let intentName = intent.name;

  // don't act on a catchall intent
  if (intentName === IntentName.VOICEFLOW) return null;

  const matcher = (command: Node.AnyAlexaCommand | null) => !!command && 'intent' in command && command.intent === intentName;

  // If Cancel Intent is not handled turn it into Stop Intent
  // This first loop is AMAZON specific, if cancel intent is not explicitly used anywhere at all, map it to stop intent
  if (intentName === IntentName.CANCEL) {
    const found = runtime.stack.getFrames().some((frame) => frame.getCommands<Node.AnyAlexaCommand>().some(matcher));

    if (!found) {
      intentName = IntentName.STOP;
      _.set(request, 'payload.intent.name', intentName);
      runtime.turn.set(T.REQUEST, request);
    }
  }

  const res = extractFrame<BaseNode.Command.Command>(runtime.stack, matcher);

  if (!res) return null;

  return {
    ...res,
    intent,
  };
};

const utilsObj = {
  Frame,
  mapSlots,
  getCommand: (runtime: Runtime) => getCommand(runtime, extractFrameCommand),
};

/**
 * The Command Handler is meant to be used inside other handlers, and should never handle nodes directly
 */
export const CommandHandler = (utils: typeof utilsObj) => ({
  canHandle: (runtime: Runtime): boolean => {
    return !!utils.getCommand(runtime);
  },
  handle: (runtime: Runtime, variables: Store): string | null => {
    const res = utils.getCommand(runtime);
    if (!res) return null;

    let nextId: string | null = null;
    let variableMap: CommandMapping[] | undefined;

    if (res.command) {
      const { index, command } = res;

      variableMap = command.mappings?.map(({ slot, variable }) => ({ slot: slot ?? '', variable: variable ?? '' }));

      if (command.diagram_id) {
        runtime.trace.debug(`matched command **${command.intent}** - adding command flow`);

        runtime.stack.top().storage.set(F.CALLED_COMMAND, true);

        // Reset state to beginning of new diagram and store current line to the stack
        const newFrame = new utils.Frame({ programID: command.diagram_id });
        runtime.stack.push(newFrame);
      } else if (command.next) {
        if (index < runtime.stack.getSize() - 1) {
          // otherwise destructive and pop off everything before the command
          runtime.stack.popTo(index + 1);
          runtime.stack.top().setNodeID(command.next);

          runtime.trace.debug(`matched intent **${command.intent}** - exiting flows and jumping to node`);
        } else if (index === runtime.stack.getSize() - 1) {
          // jumping to an intent within the same flow
          nextId = command.next;

          runtime.trace.debug(`matched intent **${command.intent}** - jumping to node`);
        }
      }
    }

    runtime.turn.delete(T.REQUEST);

    if (variableMap && res.intent.slots) {
      // map request mappings to variables
      variables.merge(utils.mapSlots({ slots: res.intent.slots, mappings: variableMap }));
    }

    return nextId;
  },
});

export default () => CommandHandler(utilsObj);
