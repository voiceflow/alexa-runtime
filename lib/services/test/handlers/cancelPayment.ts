import { HandlerFactory } from '@voiceflow/client';

import { PaymentsBlock } from '@/lib/services/voiceflow/handlers/cancelPayment';

const CancelPaymentHandler: HandlerFactory<PaymentsBlock> = () => ({
  canHandle: (block) => {
    return !!block.cancel_product_id;
  },
  handle: (block, context) => {
    context.trace.debug('__cancel payment__ - entered');

    if (block.success_id || block.fail_id) {
      context.trace.debug(
        block.success_id
          ? '__cancel payment__ - success path triggered'
          : '__cancel payment__ - success path not provided, redirecting to the fail path'
      );
    }

    return block.success_id ?? block.fail_id ?? null;
  },
});

export default CancelPaymentHandler;
