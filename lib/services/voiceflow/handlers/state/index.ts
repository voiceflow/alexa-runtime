import cancelPaymentStateHandler from './cancelPayment';
import paymentStateHandler from './payment';
import streamStateHandler from './stream';

export default [paymentStateHandler, cancelPaymentStateHandler, streamStateHandler];
