import { Handler } from '@voiceflow/client';

import { S } from '@/lib/constants';

export enum PaymentStatus {
  ACCEPTED = 'ACCEPTED',
  PURCHASED = 'ALREADY_PURCHASED',
  PENDING = 'PENDING_PURCHASE',
}

const paymentStateHandler: Handler<any> = {
  canHandle: (_, context) => {
    return !!context.storage.get(S.PAYMENT);
  },
  handle: (_, context) => {
    const payment = context.storage.get(S.PAYMENT);
    context.storage.delete(S.PAYMENT);
    if ([PaymentStatus.ACCEPTED, PaymentStatus.PURCHASED, PaymentStatus.PENDING].includes(payment.status)) {
      return payment.successPath;
    }
    return payment.failPath;
  },
};

export default paymentStateHandler;
