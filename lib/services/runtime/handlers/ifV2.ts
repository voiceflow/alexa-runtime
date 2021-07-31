import { HandlerFactory, IfV2Handler } from '@voiceflow/general-runtime/build/runtime';
import { IfV2Options } from '@voiceflow/general-runtime/build/runtime/lib/Handlers/ifV2';
import { Node } from '@voiceflow/general-types/build/nodes/ifV2';

const IfV2HandlerWrapper: HandlerFactory<Node, IfV2Options> = ({ _v1, safe }) => {
  const ifHandler = IfV2Handler({ _v1, safe });

  return {
    canHandle: (...args) => {
      return ifHandler.canHandle(...args);
    },
    handle: async (node, runtime, variables, program) => {
      // eval/debug statements here
      const startTime = Date.now();
      // eslint-disable-next-line no-console
      console.log(`evaluating if block ${node.id}:: ${JSON.stringify(node.payload.expressions).substring(0, 48)}`);
      const code = (await ifHandler.handle(node, runtime, variables, program)) as any;
      // eslint-disable-next-line no-console
      console.log(`finished if block ${node.id}:: elapsed: ${Date.now() - startTime}`);
      return code;
    },
  };
};

export default IfV2HandlerWrapper;
