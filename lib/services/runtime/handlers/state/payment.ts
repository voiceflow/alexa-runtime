import { HandlerFactory } from '@voiceflow/general-runtime/build/runtime';

import { S } from '@/lib/constants';

import { PaymentStorage } from '../payment';

const SUCCESS_PATHS: Set<string> = new Set(['PENDING_PURCHASE', 'ACCEPTED', 'ALREADY_PURCHASED']);

const paymentStateHandler: HandlerFactory<any> = () => ({
  canHandle: (_, runtime) => !!runtime.storage.get<PaymentStorage>(S.PAYMENT),
  handle: (_, runtime) => {
    const payment = runtime.storage.get<PaymentStorage>(S.PAYMENT);

    runtime.storage.delete(S.PAYMENT);

    if (payment?.status && SUCCESS_PATHS.has(payment.status)) {
      return payment.successPath ?? null;
    }

    return payment?.failPath ?? null;
  },
});

export default paymentStateHandler;
