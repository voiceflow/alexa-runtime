import { Node, TraceFrame } from '@voiceflow/general-types/build/nodes/_v1';
import { HandlerFactory } from '@voiceflow/runtime';

export const _V1Handler: HandlerFactory<Node> = () => ({
  canHandle: (node) => node._v === 1,
  handle: (node, runtime) => {
    const defaultPath = node.paths[node.defaultPath || 0]?.nextID || null;

    runtime.trace.addTrace<TraceFrame>({
      type: node.type,
      payload: { data: node.payload, paths: node.paths },
    });

    return defaultPath;
  },
});

export default () => _V1Handler();
