import { Handler } from '@voiceflow/client';

import { S } from '@/lib/constants';
import { ResponseBuilder } from '@/lib/services/voiceflow/types';

export type PaymentsBlock = {
  blockID: string;
  cancel_product_id?: string;
  success_id?: string;
  fail_id?: string;
};

export const CancelPaymentResponseBuilder: ResponseBuilder = (context, builder) => {
  // check cancel payment
  const cancelPayment = context.storage.get(S.CANCEL_PAYMENT);

  if (cancelPayment && !cancelPayment.status) {
    // return an early response if there is a cancel payment block
    builder
      .addDirective({
        type: 'Connections.SendRequest',
        name: 'Cancel',
        payload: {
          InSkillProduct: {
            productId: cancelPayment.productId,
          },
        },
        token: 'correlatonToken',
      })
      .withShouldEndSession(true);
  }
};

const CancelPaymentHandler: Handler<PaymentsBlock> = {
  canHandle: (block) => {
    return !!block.cancel_product_id;
  },
  handle: (block, context) => {
    context.storage.set(S.CANCEL_PAYMENT, {
      productId: block.cancel_product_id,
      successPath: block.success_id,
      failPath: block.fail_id,
      status: null,
    });

    // stop on itself and wait for paymentStateHandler to determine next path
    return block.blockID;
  },
};

export default CancelPaymentHandler;
