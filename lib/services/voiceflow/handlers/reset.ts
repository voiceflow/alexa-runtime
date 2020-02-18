import { Handler } from '@voiceflow/client';

export type ResetBlock = {
  reset?: boolean;
};

/**
 * reset the entire stack to the first flow and it's first block
 */
const ResetHandler: Handler<ResetBlock> = {
  canHandle: (block) => {
    return !!block.reset;
  },
  handle: (_, context): null => {
    context.stack.popTo(1);
    context.stack.top().setBlockID(null);
    return null;
  },
};

export default ResetHandler;
