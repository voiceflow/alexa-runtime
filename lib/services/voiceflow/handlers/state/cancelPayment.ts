import { Handler } from '@voiceflow/client';

import { S } from '@/lib/constants';

export enum PaymentStatus {
  ACCEPTED = 'ACCEPTED',
}

const cancelPaymentStateHandler: Handler<any> = {
  canHandle: (_, context) => {
    return !!context.storage.get(S.CANCEL_PAYMENT);
  },
  handle: (_, context) => {
    const cancelPayment = context.storage.get(S.CANCEL_PAYMENT);
    context.storage.delete(S.CANCEL_PAYMENT);
    if (PaymentStatus.ACCEPTED === cancelPayment.status) {
      return cancelPayment.successPath;
    }
    return cancelPayment.failPath;
  },
};

export default cancelPaymentStateHandler;
