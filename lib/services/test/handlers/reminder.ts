import { HandlerFactory } from '@voiceflow/client';

import { ReminderBlock } from '@/lib/services/voiceflow/handlers/reminder';

export const ReminderHandlerGenerator: HandlerFactory<ReminderBlock> = () => ({
  canHandle: (block) => {
    return !!block.reminder;
  },
  handle: (block, context) => {
    context.trace.debug('__reminder__ - entered');

    if (block.success_id || block.fail_id) {
      context.trace.debug(
        block.success_id ? '__reminder__ - success path triggered' : '__reminder__ - success path not provided, redirecting to the fail path'
      );
    }

    return block.success_id ?? block.fail_id ?? null;
  },
});

export default ReminderHandlerGenerator;
