import { BaseNode } from '@voiceflow/base-types';
import { HandlerFactory } from '@voiceflow/general-runtime/build/runtime';

export const _V1Handler: HandlerFactory<BaseNode._v1.Node> = () => ({
  canHandle: (node) => node._v === 1,
  handle: (node) => {
    // custom trace behavior here
    return node.paths[node.defaultPath || 0]?.nextID || null;
  },
});

export default () => _V1Handler();
