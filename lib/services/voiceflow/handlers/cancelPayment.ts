import { Node } from '@voiceflow/alexa-types/build/nodes/cancelPayment';
import { NodeID } from '@voiceflow/general-types';
import { HandlerFactory } from '@voiceflow/runtime';
import { interfaces } from 'ask-sdk-model';

import { S } from '@/lib/constants';
import { ResponseBuilder } from '@/lib/services/voiceflow/types';

export type CancelPaymentStorage = {
  status: null | false | interfaces.monetization.v1.PurchaseResult;
  failPath?: NodeID;
  productId: string;
  successPath?: NodeID;
};

export const CancelPaymentResponseBuilder: ResponseBuilder = (context, builder) => {
  // check cancel payment
  const cancelPayment = context.storage.get<CancelPaymentStorage>(S.CANCEL_PAYMENT);

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

const CancelPaymentHandler: HandlerFactory<Node> = () => ({
  canHandle: (node) => 'cancel_product_id' in node && !!node.cancel_product_id,
  handle: (node, context) => {
    if (!('cancel_product_id' in node)) {
      return node.nextId ?? null;
    }

    context.storage.set<CancelPaymentStorage>(S.CANCEL_PAYMENT, {
      status: null,
      failPath: node.fail_id,
      productId: node.cancel_product_id,
      successPath: node.success_id,
    });

    // stop on itself and wait for paymentStateHandler to determine next path
    return node.id;
  },
});

export default CancelPaymentHandler;
