import { Node } from '@voiceflow/general-types/build/nodes/code';
import { CodeHandler, HandlerFactory } from '@voiceflow/runtime';

const CodeHandlerWrapper: HandlerFactory<Node, { endpoint: string }> = ({ endpoint }) => {
  const codeHandler = CodeHandler({ endpoint });

  return {
    canHandle: (...args) => {
      return codeHandler.canHandle(...args);
    },
    handle: async (node, context, variables, program) => {
      // eval/debug statements here

      return codeHandler.handle(node, context, variables, program) as any;
    },
  };
};

export default CodeHandlerWrapper;
