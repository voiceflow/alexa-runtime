import { Handler } from '@voiceflow/client';

import { PaymentsBlock } from '@/lib/services/voiceflow/handlers/cancelPayment';

const CancelPaymentHandler: Handler<PaymentsBlock> = {
  canHandle: (block) => {
    return !!block.cancel_product_id;
  },
  handle: (block, context) => {
    context.trace.debug('__Cancel payment__ - entered');

    if (block.success_id || block.fail_id) {
      context.trace.debug(
        block.success_id
          ? '__Cancel payment__ - redirecting to the success block'
          : '__Cancel payment__ - success link is not provided, redirecting to the fail block'
      );
    }

    return block.success_id ?? block.fail_id ?? null;
  },
};

export default CancelPaymentHandler;
