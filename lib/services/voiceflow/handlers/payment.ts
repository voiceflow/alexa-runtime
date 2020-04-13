import { HandlerFactory } from '@voiceflow/client';

import { S } from '@/lib/constants';
import { ResponseBuilder } from '@/lib/services/voiceflow/types';

export type PaymentsBlock = {
  blockID: string;
  product_id?: string;
  success_id?: string;
  fail_id?: string;
};

export const PaymentResponseBuilder: ResponseBuilder = (context, builder) => {
  // check payment
  const payment = context.storage.get(S.PAYMENT);

  if (payment && !payment.status) {
    // return an early response if there is a payment block
    builder
      .addDirective({
        type: 'Connections.SendRequest',
        name: 'Buy',
        payload: {
          InSkillProduct: {
            productId: payment.productId,
          },
        },
        token: 'correlatonToken',
      })
      .withShouldEndSession(true);
  }
};

const PaymentHandler: HandlerFactory<PaymentsBlock> = () => ({
  canHandle: (block) => {
    return !!block.product_id;
  },
  handle: (block, context) => {
    context.storage.set(S.PAYMENT, {
      productId: block.product_id,
      successPath: block.success_id,
      failPath: block.fail_id,
      status: null,
    });

    // stop on itself and wait for paymentStateHandler to determine next path
    return block.blockID;
  },
});

export default PaymentHandler;
