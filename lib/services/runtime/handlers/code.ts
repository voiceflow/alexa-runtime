import { BaseNode } from '@voiceflow/base-types';
import { CodeHandler, HandlerFactory } from '@voiceflow/general-runtime/build/runtime';

const CodeHandlerWrapper: HandlerFactory<BaseNode.Code.Node, { endpoint: string | null }> = ({ endpoint }) => {
  const codeHandler = CodeHandler({ endpoint });

  return {
    canHandle: (...args) => codeHandler.canHandle(...args),

    handle: (node, runtime, variables, program) => codeHandler.handle(node, runtime, variables, program),
  };
};

export default CodeHandlerWrapper;
