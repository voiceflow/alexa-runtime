import { AlexaNode } from '@voiceflow/alexa-types';
import { BaseNode } from '@voiceflow/base-types';
import { HandlerFactory } from '@voiceflow/general-runtime/build/runtime';
import { interfaces } from 'ask-sdk-model';

import { S } from '@/lib/constants';
import { ResponseBuilder } from '@/lib/services/runtime/types';

export interface CancelPaymentStorage {
  status: null | false | interfaces.monetization.v1.PurchaseResult;
  failPath?: BaseNode.Utils.NodeID;
  productId: string;
  successPath?: BaseNode.Utils.NodeID;
}

export const CancelPaymentResponseBuilder: ResponseBuilder = (runtime, builder) => {
  // check cancel payment
  const cancelPayment = runtime.storage.get<CancelPaymentStorage>(S.CANCEL_PAYMENT);

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

const CancelPaymentHandler: HandlerFactory<AlexaNode.CancelPayment.Node> = () => ({
  canHandle: (node) => 'cancel_product_id' in node && !!node.cancel_product_id,
  handle: (node, runtime) => {
    if (!('cancel_product_id' in node)) {
      return node.nextId ?? null;
    }

    runtime.storage.set<CancelPaymentStorage>(S.CANCEL_PAYMENT, {
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
