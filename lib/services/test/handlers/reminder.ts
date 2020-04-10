import { HandlerFactory } from '@voiceflow/client';

import { ReminderBlock } from '@/lib/services/voiceflow/handlers/reminder';

export const ReminderHandlerGenerator: HandlerFactory<ReminderBlock> = () => ({
  canHandle: (block) => {
    return !!block.reminder;
  },
  handle: (block, context) => {
    context.trace.debug('__Reminder__ - entered');

    if (block.success_id || block.fail_id) {
      context.trace.debug(
        block.success_id ? 'Reminder - redirecting to the success block' : 'Reminder - success link is not provided, redirecting to the fail block'
      );
    }

    return block.success_id ?? block.fail_id ?? null;
  },
});

export default ReminderHandlerGenerator;
