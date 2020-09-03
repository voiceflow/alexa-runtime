import { Node } from '@voiceflow/api-sdk';
import { HandlerFactory } from '@voiceflow/client';

export type ResetNode = Node<
  'reset',
  {
    reset?: boolean;
  }
>;

/**
 * reset the entire stack to the first flow and it's first node
 */
const ResetHandler: HandlerFactory<ResetNode> = () => ({
  canHandle: (node) => {
    return !!node.reset;
  },
  handle: (_, context): null => {
    context.stack.popTo(1);
    context.stack.top().setNodeID(null);
    return null;
  },
});

export default ResetHandler;
