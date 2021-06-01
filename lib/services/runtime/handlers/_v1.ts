import { HandlerFactory } from '@voiceflow/general-runtime/build/runtime';
import { Node } from '@voiceflow/general-types/build/nodes/_v1';

export const _V1Handler: HandlerFactory<Node> = () => ({
  canHandle: (node) => node._v === 1,
  handle: (node) => {
    // custom trace behavior here
    return node.paths[node.defaultPath || 0]?.nextID || null;
  },
});

export default () => _V1Handler();
