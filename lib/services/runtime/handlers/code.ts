import { CodeHandler, HandlerFactory } from '@voiceflow/general-runtime/build/runtime';
import { Node } from '@voiceflow/general-types/build/nodes/code';

const CodeHandlerWrapper: HandlerFactory<Node, { endpoint: string | null }> = ({ endpoint }) => {
  const codeHandler = CodeHandler({ endpoint });

  return {
    canHandle: (...args) => {
      return codeHandler.canHandle(...args);
    },
    handle: async (node, runtime, variables, program) => {
      // eval/debug statements here
      const startTime = Date.now();
      // eslint-disable-next-line no-console
      console.log(`evaluating code block ${node.id}:: ${node.code.substring(0, 48)}`);
      const code = (await codeHandler.handle(node, runtime, variables, program)) as any;
      // eslint-disable-next-line no-console
      console.log(`finished code block ${node.id}:: elapsed: ${Date.now() - startTime}`);
      return code;
    },
  };
};

export default CodeHandlerWrapper;
