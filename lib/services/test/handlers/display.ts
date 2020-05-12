import { HandlerFactory } from '@voiceflow/client';

import { Display } from '@/lib/services/voiceflow/handlers/display';

const DisplayHandler: HandlerFactory<Display> = () => ({
  canHandle: (block) => {
    return !!block.display_id;
  },
  handle: (block, context) => {
    context.trace.debug('__display__ - entered');

    if (block.nextId) {
      context.trace.debug('__display__ - redirecting to the next step');
    }

    return block.nextId ?? null;
  },
});

export default DisplayHandler;
