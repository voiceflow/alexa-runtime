import { HandlerFactory } from '@voiceflow/client';

import { PaymentsBlock } from '@/lib/services/voiceflow/handlers/payment';

const PaymentHandler: HandlerFactory<PaymentsBlock> = () => ({
  canHandle: (block) => {
    return !!block.product_id;
  },
  handle: (block, context) => {
    context.trace.debug('__payment__ - entered');

    if (block.success_id || block.fail_id) {
      context.trace.debug(
        block.success_id ? '__payment__ - success path triggered' : '__payment__ - success path not provided, redirecting to the fail path'
      );
    }

    return block.success_id ?? block.fail_id ?? null;
  },
});

export default PaymentHandler;
