import { Node } from '@voiceflow/alexa-types/build/nodes/cancelPayment';
import { HandlerFactory } from '@voiceflow/runtime';

const CancelPaymentHandler: HandlerFactory<Node> = () => ({
  canHandle: (node) => 'cancel_product_id' in node && !!node.cancel_product_id,
  handle: (node, context) => {
    if (!('cancel_product_id' in node)) {
      return node.nextId ?? null;
    }

    context.trace.debug('__cancel payment__ - entered');

    if (node.success_id || node.fail_id) {
      context.trace.debug(
        node.success_id
          ? '__cancel payment__ - success path triggered'
          : '__cancel payment__ - success path not provided, redirecting to the fail path'
      );
    }

    return node.success_id ?? node.fail_id ?? null;
  },
});

export default CancelPaymentHandler;
