/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable no-restricted-syntax */
import { AlexaNode } from '@voiceflow/alexa-types';
import { BaseModels, BaseNode } from '@voiceflow/base-types';
import { Utils } from '@voiceflow/common';
import { Frame, Runtime, Store } from '@voiceflow/general-runtime/build/runtime';
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

const matcher = (intentName: string) => (command: AlexaNode.AnyCommand | null) =>
  !!command && Utils.object.hasProperty(command, 'intent') && command.intent === intentName;

export const getCommand = (runtime: Runtime) => {
  const request = runtime.turn.get<IntentRequest>(T.REQUEST);

  if (request?.type !== RequestType.INTENT) return null;

  const { intent } = request.payload;
  let intentName = intent.name;

  // don't act on a catchall intent
  if (intentName === IntentName.VOICEFLOW) return null;

  // If Cancel Intent is not handled turn it into Stop Intent
  // This first loop is AMAZON specific, if cancel intent is not explicitly used anywhere at all, map it to stop intent
  if (intentName === IntentName.CANCEL) {
    const found = runtime.stack.getFrames().some((frame) => frame.getCommands<AlexaNode.AnyCommand>().some(matcher(intentName)));

    if (!found) {
      intentName = IntentName.STOP;
      _.set(request, 'payload.intent.name', intentName);
      runtime.turn.set(T.REQUEST, request);
    }
  }

  const frames = runtime.stack.getFrames();
  for (let index = frames.length - 1; index >= 0; index--) {
    const commands = frames[index]?.getCommands<BaseNode.AnyCommonCommand>() ?? [];

    for (const command of commands) {
      const commandDiagramID = (isPushCommand(command) && command.diagram_id) || (isIntentCommand(command) && command.diagramID);
      if (request.diagramID && commandDiagramID && request.diagramID !== commandDiagramID) {
        continue;
      }

      if (matcher(intentName)(command)) {
        return { index, command, intent };
      }
    }
  }

  return null;
};

const utilsObj = {
  Frame,
  mapSlots,
  getCommand,
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

    let variableMap: BaseModels.CommandMapping[] | undefined;

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
