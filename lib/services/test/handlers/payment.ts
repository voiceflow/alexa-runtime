import { Node } from '@voiceflow/alexa-types/build/nodes/payment';
import { HandlerFactory } from '@voiceflow/runtime';

const PaymentHandler: HandlerFactory<Node> = () => ({
  canHandle: (node) => 'product_id' in node && !!node.product_id,
  handle: (node, context) => {
    if (!('product_id' in node)) {
      return node.nextId ?? null;
    }

    context.trace.debug('__payment__ - entered');

    if (node.success_id || node.fail_id) {
      context.trace.debug(
        node.success_id ? '__payment__ - success path triggered' : '__payment__ - success path not provided, redirecting to the fail path'
      );
    }

    return node.success_id ?? node.fail_id ?? null;
  },
});

export default PaymentHandler;
