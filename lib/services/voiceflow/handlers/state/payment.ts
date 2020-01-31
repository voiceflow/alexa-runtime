import { S } from '@/lib/constants';

import { Handler } from '../../types';

export enum paymentStatus {
  ACCEPTED = 'ACCEPTED',
  PURCHASED = 'ALREADY_PURCHASED',
  PENDING = 'PENDING_PURCHASE',
}

const paymentStateHandler: Handler = {
  canHandle: (_, context) => {
    return !!context.storage.get(S.PAYMENT);
  },
  handle: (_, context) => {
    const payment = context.storage.get(S.PAYMENT);
    context.storage.delete(S.PAYMENT);

    if ([paymentStatus.ACCEPTED, paymentStatus.PURCHASED, paymentStatus.PENDING].includes(payment.status)) {
      return payment.successPath;
    }
    return payment.failPath;
  },
};

export default paymentStateHandler;
