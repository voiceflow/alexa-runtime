import { HandlerFactory } from '@voiceflow/client';

import { T } from '@/lib/constants';
import CommandHandler from '@/lib/services/voiceflow/handlers/command';
import RepeatHandler from '@/lib/services/voiceflow/handlers/repeat';
import { IntentRequest, RequestType } from '@/lib/services/voiceflow/types';
import { addRepromptIfExists } from '@/lib/services/voiceflow/utils';

import getBestScore from './score';

type Choice = {
  elseId?: string;
  nextIds: string[];
  reprompt?: string;
  choices: any[];
  inputs: Array<string[]>;
  chips?: string[];
};
const utilsObj = {
  addRepromptIfExists,
  getBestScore,
  commandHandler: CommandHandler(),
  repeatHandler: RepeatHandler(),
};

// THIS HANDLER IS USED PURELY FOR THE TESTING TOOL, NOT FOR ALEXA
export const ChoiceHandler: HandlerFactory<Choice, typeof utilsObj> = (utils) => ({
  canHandle: (block) => {
    return !!block.choices;
  },
  handle: (block, context, variables) => {
    const request = context.turn.get(T.REQUEST) as IntentRequest;

    if (request?.type !== RequestType.INTENT) {
      utils.addRepromptIfExists(block, context, variables);
      context.trace.choice(block.inputs.map((choice) => ({ name: choice[0] })));

      // quit cycleStack without ending session by stopping on itself
      return block.blockID;
    }

    let nextId: string | null = null;

    const { input } = request.payload;

    if (input) {
      // flatten inputs
      const choices = block.inputs.reduce((acc: Array<{ value: string; index: number }>, option, index) => {
        option.forEach((item) => {
          acc.push({ value: item, index });
        });

        return acc;
      }, []);

      const choice = utils.getBestScore(input, choices);

      if (choice != null && choice.index in block.nextIds) {
        context.trace.debug(`matched choice **${choice.value}** - taking path ${choice.index + 1}`);
        nextId = block.nextIds[choice.index];
      }
    }

    // check if there is a command in the stack that fulfills intent
    if (!nextId) {
      if (utils.commandHandler.canHandle(context)) {
        return utils.commandHandler.handle(context, variables);
      }
      if (utils.repeatHandler.canHandle(context)) {
        return utils.repeatHandler.handle(context);
      }
    }

    // request for this turn has been processed, delete request
    context.turn.delete(T.REQUEST);

    return (nextId || block.elseId) ?? null;
  },
});

export default () => ChoiceHandler(utilsObj);
