import { Node } from '@voiceflow/api-sdk';
import { TraceType } from '@voiceflow/general-types';
import { TraceFrame as InteractionTraceFrame } from '@voiceflow/general-types/build/nodes/interaction';
import { HandlerFactory } from '@voiceflow/runtime';

import { T } from '@/lib/constants';
import CommandHandler from '@/lib/services/runtime/handlers/command';
import RepeatHandler from '@/lib/services/runtime/handlers/repeat';
import { IntentRequest, RequestType } from '@/lib/services/runtime/types';
import { addRepromptIfExists } from '@/lib/services/runtime/utils';

import getBestScore from './score';

type ChoiceNode = Node<
  'choice',
  {
    elseId?: string;
    nextIds: string[];
    reprompt?: string;
    choices: any[];
    inputs: Array<string[]>;
    chips?: string[];
  }
>;
const utilsObj = {
  addRepromptIfExists,
  getBestScore,
  commandHandler: CommandHandler(),
  repeatHandler: RepeatHandler(),
};

// THIS HANDLER IS USED PURELY FOR THE TESTING TOOL, NOT FOR ALEXA
export const ChoiceHandler: HandlerFactory<ChoiceNode, typeof utilsObj> = (utils) => ({
  canHandle: (node) => !!node.choices,
  handle: (node, runtime, variables) => {
    const request = runtime.turn.get<IntentRequest>(T.REQUEST);

    if (request?.type !== RequestType.INTENT) {
      utils.addRepromptIfExists({ node, runtime, variables });

      runtime.trace.addTrace<InteractionTraceFrame>({
        type: TraceType.CHOICE,
        payload: { choices: node.inputs.map((choice) => ({ name: choice[0] })) },
      });

      // quit cycleStack without ending session by stopping on itself
      return node.id;
    }

    let nextId: string | null = null;

    const { input } = request.payload;

    if (input) {
      // flatten inputs
      const choices = node.inputs.reduce((acc: Array<{ value: string; index: number }>, option, index) => {
        option.forEach((item) => {
          acc.push({ value: item, index });
        });

        return acc;
      }, []);

      const choice = utils.getBestScore(input, choices);

      if (choice != null && choice.index in node.nextIds) {
        runtime.trace.debug(`matched choice **${choice.value}** - taking path ${choice.index + 1}`);
        nextId = node.nextIds[choice.index];
      }
    }

    // check if there is a command in the stack that fulfills intent
    if (!nextId) {
      if (utils.commandHandler.canHandle(runtime)) {
        return utils.commandHandler.handle(runtime, variables);
      }
      if (utils.repeatHandler.canHandle(runtime)) {
        return utils.repeatHandler.handle(runtime);
      }
    }

    // request for this turn has been processed, delete request
    runtime.turn.delete(T.REQUEST);

    return (nextId || node.elseId) ?? null;
  },
});

export default () => ChoiceHandler(utilsObj);
