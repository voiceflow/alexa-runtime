import { HandlerFactory } from '@voiceflow/runtime';

import { S } from '@/lib/constants';

import { PaymentStorage } from '../payment';

const SUCCESS_PATHS = ['PENDING_PURCHASE', 'ACCEPTED', 'ALREADY_PURCHASED'];

const paymentStateHandler: HandlerFactory<any> = () => ({
  canHandle: (_, context) => !!context.storage.get<PaymentStorage>(S.PAYMENT),
  handle: (_, context) => {
    const payment = context.storage.get<PaymentStorage>(S.PAYMENT);

    context.storage.delete(S.PAYMENT);

    if (payment?.status && SUCCESS_PATHS.includes(payment.status)) {
      return payment.successPath ?? null;
    }

    return payment?.failPath ?? null;
  },
});

export default paymentStateHandler;
