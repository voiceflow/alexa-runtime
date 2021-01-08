import { Node } from '@voiceflow/general-types/build/nodes/code';
import { CodeHandler, HandlerFactory } from '@voiceflow/runtime';

const Code2Handler: HandlerFactory<Node, { CODE_HANDLER_ENDPOINT: string }> = ({ CODE_HANDLER_ENDPOINT }) => ({
  canHandle: (...args) => {
    return CodeHandler({ endpoint: CODE_HANDLER_ENDPOINT }).canHandle(...args);
  },
  handle: (node, context, variables, program) => {
    console.log('IM IN THE CODE BLOCK');
    console.log(node);

    // eslint-disable-next-line no-eval
    eval(node.code);

    return CodeHandler({ endpoint: CODE_HANDLER_ENDPOINT }).handle(node, context, variables, program) as any;
  },
});

export default Code2Handler;
