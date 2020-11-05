import { Node } from '@voiceflow/alexa-types/build/nodes/reminder';
import { HandlerFactory } from '@voiceflow/runtime';

export const ReminderHandlerGenerator: HandlerFactory<Node> = () => ({
  canHandle: (node) => {
    return !!node.reminder;
  },
  handle: (node, context) => {
    context.trace.debug('__reminder__ - entered');

    if (node.success_id || node.fail_id) {
      context.trace.debug(
        node.success_id ? '__reminder__ - success path triggered' : '__reminder__ - success path not provided, redirecting to the fail path'
      );
    }

    return node.success_id ?? node.fail_id ?? null;
  },
});

export default ReminderHandlerGenerator;
