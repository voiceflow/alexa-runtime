import { HandlerFactory } from '@voiceflow/runtime';

import { S } from '@/lib/constants';

import { CancelPaymentStorage } from '../cancelPayment';

const cancelPaymentStateHandler: HandlerFactory<any> = () => ({
  canHandle: (_, context) => !!context.storage.get<CancelPaymentStorage>(S.CANCEL_PAYMENT),
  handle: (_, context) => {
    const cancelPayment = context.storage.get<CancelPaymentStorage>(S.CANCEL_PAYMENT);

    context.storage.delete(S.CANCEL_PAYMENT);

    if (cancelPayment?.status === 'ACCEPTED') {
      return cancelPayment.successPath ?? null;
    }

    return cancelPayment?.failPath ?? null;
  },
});

export default cancelPaymentStateHandler;
