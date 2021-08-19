import { Node } from '@voiceflow/alexa-types';
import { Node as BaseNode } from '@voiceflow/base-types';
import { HandlerFactory } from '@voiceflow/general-runtime/build/runtime';
import { interfaces } from 'ask-sdk-model';

import { S } from '@/lib/constants';
import { SEND_REQUEST_DIRECTIVE } from '@/lib/services/alexa/constants';
import { ResponseBuilder } from '@/lib/services/runtime/types';

export type PaymentStorage = {
  status: null | false | interfaces.monetization.v1.PurchaseResult;
  failPath?: BaseNode.Utils.NodeID;
  productId: string;
  successPath?: BaseNode.Utils.NodeID;
};

export const PaymentResponseBuilder: ResponseBuilder = (runtime, builder) => {
  // check payment
  const payment = runtime.storage.get<PaymentStorage>(S.PAYMENT);

  if (payment && !payment.status) {
    // return an early response if there is a payment node
    builder
      .addDirective({
        type: SEND_REQUEST_DIRECTIVE,
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

const PaymentHandler: HandlerFactory<Node.Payment.Node> = () => ({
  canHandle: (node) => 'product_id' in node && !!node.product_id,
  handle: (node, runtime) => {
    if (!('product_id' in node)) {
      return node.nextId ?? null;
    }

    runtime.storage.set<PaymentStorage>(S.PAYMENT, {
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
