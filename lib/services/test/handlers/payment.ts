import { HandlerFactory } from '@voiceflow/client';

import { PaymentsNode } from '@/lib/services/voiceflow/handlers/payment';

const PaymentHandler: HandlerFactory<PaymentsNode> = () => ({
  canHandle: (node) => {
    return !!node.product_id;
  },
  handle: (node, context) => {
    context.trace.debug('__payment__ - entered');

    if (node.success_id || node.fail_id) {
      context.trace.debug(
        node.success_id ? '__payment__ - success path triggered' : '__payment__ - success path not provided, redirecting to the fail path'
      );
    }

    return node.success_id ?? node.fail_id ?? null;
  },
});

export default PaymentHandler;
