import { Node } from '@voiceflow/alexa-types';
import { CommandMapping } from '@voiceflow/api-sdk';
import { Node as BaseNode } from '@voiceflow/base-types';
import { extractFrameCommand, Frame, Runtime, Store } from '@voiceflow/general-runtime/build/runtime';
import _ from 'lodash';

import { F, T } from '@/lib/constants';

import { IntentName, IntentRequest, RequestType } from '../types';
import { mapSlots } from '../utils';

const isPushCommand = (command: BaseNode.AnyCommonCommand): command is BaseNode.Command.Command & { diagram_id: string } => {
  return !!(command as BaseNode.Command.Command).diagram_id;
};

const isIntentCommand = (command: BaseNode.AnyCommonCommand): command is BaseNode.Intent.Command => {
  return !isPushCommand(command) && !!(command as BaseNode.Intent.Command).next;
};

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

  const res = extractFrame<BaseNode.AnyCommonCommand>(runtime.stack, matcher);

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

    let variableMap: CommandMapping[] | undefined;

    if (res.command) {
      const { index, command } = res;

      variableMap = command.mappings?.map(({ slot, variable }) => ({ slot: slot ?? '', variable: variable ?? '' }));

      if (isPushCommand(command)) {
        runtime.trace.debug(`matched command **${command.intent}** - adding command flow`);

        runtime.stack.top().storage.set(F.CALLED_COMMAND, true);

        // Reset state to beginning of new diagram and store current line to the stack
        const newFrame = new utils.Frame({ programID: command.diagram_id });
        runtime.stack.push(newFrame);
      } else if (isIntentCommand(command)) {
        runtime.stack.popTo(index + 1);
        if (command.diagramID && command.diagramID !== runtime.stack.top().getProgramID()) {
          const newFrame = new utils.Frame({ programID: command.diagramID });
          runtime.stack.push(newFrame);
        }
        runtime.stack.top().setNodeID(command.next || null);
        runtime.trace.debug(`matched intent **${command.intent}** - jumping to node`);
      }
    }

    runtime.turn.delete(T.REQUEST);

    if (variableMap && res.intent.slots) {
      // map request mappings to variables
      variables.merge(utils.mapSlots({ slots: res.intent.slots, mappings: variableMap }));
    }

    return null;
  },
});

export default () => CommandHandler(utilsObj);
