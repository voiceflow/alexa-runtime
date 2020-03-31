import { Handler } from '@voiceflow/client';

import { PaymentsBlock } from '@/lib/services/voiceflow/handlers/payment';

const PaymentHandler: Handler<PaymentsBlock> = {
  canHandle: (block) => {
    return !!block.product_id;
  },
  handle: (block, context) => {
    context.trace.debug('__Payment__ - entered');

    if (block.success_id || block.fail_id) {
      context.trace.debug(
        block.success_id ? 'Payment - redirecting to the success block' : 'Payment - success link is not provided, redirecting to the fail block'
      );
    }

    return block.success_id ?? block.fail_id ?? null;
  },
};

export default PaymentHandler;
