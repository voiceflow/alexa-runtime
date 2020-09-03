import { NodeType } from '@voiceflow/alexa-types';
import { Node } from '@voiceflow/api-sdk';
import { HandlerFactory } from '@voiceflow/client';

import { S } from '@/lib/constants';
import { ResponseBuilder } from '@/lib/services/voiceflow/types';

export type PaymentsNode = Node<
  NodeType.ACCOUNT_LINKING,
  {
    cancel_product_id?: string;
    success_id?: string;
    fail_id?: string;
  }
>;

export const CancelPaymentResponseBuilder: ResponseBuilder = (context, builder) => {
  // check cancel payment
  const cancelPayment = context.storage.get(S.CANCEL_PAYMENT);

  if (cancelPayment && !cancelPayment.status) {
    // return an early response if there is a cancel payment node
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

const CancelPaymentHandler: HandlerFactory<PaymentsNode> = () => ({
  canHandle: (node) => {
    return !!node.cancel_product_id;
  },
  handle: (node, context) => {
    context.storage.set(S.CANCEL_PAYMENT, {
      productId: node.cancel_product_id,
      successPath: node.success_id,
      failPath: node.fail_id,
      status: null,
    });

    // stop on itself and wait for paymentStateHandler to determine next path
    return node.id;
  },
});

export default CancelPaymentHandler;
