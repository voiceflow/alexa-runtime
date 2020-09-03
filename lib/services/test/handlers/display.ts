import { HandlerFactory } from '@voiceflow/client';

import { DisplayNode } from '@/lib/services/voiceflow/handlers/display';

const DisplayHandler: HandlerFactory<DisplayNode> = () => ({
  canHandle: (node) => {
    return !!node.display_id;
  },
  handle: (node, context) => {
    context.trace.debug('__display__ - entered');

    if (node.nextId) {
      context.trace.debug('__display__ - redirecting to the next step');
    }

    return node.nextId ?? null;
  },
});

export default DisplayHandler;
