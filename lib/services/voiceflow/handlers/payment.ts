import { NodeType } from '@voiceflow/alexa-types';
import { Node } from '@voiceflow/api-sdk';
import { HandlerFactory } from '@voiceflow/client';

import { S } from '@/lib/constants';
import { ResponseBuilder } from '@/lib/services/voiceflow/types';

export type PaymentsNode = Node<
  NodeType.PAYMENT,
  {
    product_id?: string;
    success_id?: string;
    fail_id?: string;
  }
>;

export const PaymentResponseBuilder: ResponseBuilder = (context, builder) => {
  // check payment
  const payment = context.storage.get(S.PAYMENT);

  if (payment && !payment.status) {
    // return an early response if there is a payment node
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

const PaymentHandler: HandlerFactory<PaymentsNode> = () => ({
  canHandle: (node) => {
    return !!node.product_id;
  },
  handle: (node, context) => {
    context.storage.set(S.PAYMENT, {
      productId: node.product_id,
      successPath: node.success_id,
      failPath: node.fail_id,
      status: null,
    });

    // stop on itself and wait for paymentStateHandler to determine next path
    return node.id;
  },
});

export default PaymentHandler;
