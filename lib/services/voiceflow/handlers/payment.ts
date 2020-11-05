import { Node } from '@voiceflow/alexa-types/build/nodes/payment';
import { NodeID } from '@voiceflow/general-types';
import { HandlerFactory } from '@voiceflow/runtime';
import { interfaces } from 'ask-sdk-model';

import { S } from '@/lib/constants';
import { ResponseBuilder } from '@/lib/services/voiceflow/types';

export type PaymentStorage = {
  status: null | false | interfaces.monetization.v1.PurchaseResult;
  failPath?: NodeID;
  productId: string;
  successPath?: NodeID;
};

export const PaymentResponseBuilder: ResponseBuilder = (context, builder) => {
  // check payment
  const payment = context.storage.get<PaymentStorage>(S.PAYMENT);

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

const PaymentHandler: HandlerFactory<Node> = () => ({
  canHandle: (node) => 'product_id' in node && !!node.product_id,
  handle: (node, context) => {
    if (!('product_id' in node)) {
      return node.nextId ?? null;
    }

    context.storage.set<PaymentStorage>(S.PAYMENT, {
      status: null,
      failPath: node.fail_id,
      productId: node.product_id,
      successPath: node.success_id,
    });

    // stop on itself and wait for paymentStateHandler to determine next path
    return node.id;
  },
});

export default PaymentHandler;
