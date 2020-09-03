import { HandlerFactory } from '@voiceflow/client';

import { PaymentsNode } from '@/lib/services/voiceflow/handlers/cancelPayment';

const CancelPaymentHandler: HandlerFactory<PaymentsNode> = () => ({
  canHandle: (node) => {
    return !!node.cancel_product_id;
  },
  handle: (node, context) => {
    context.trace.debug('__cancel payment__ - entered');

    if (node.success_id || node.fail_id) {
      context.trace.debug(
        node.success_id
          ? '__cancel payment__ - success path triggered'
          : '__cancel payment__ - success path not provided, redirecting to the fail path'
      );
    }

    return node.success_id ?? node.fail_id ?? null;
  },
});

export default CancelPaymentHandler;
