import cancelPaymentStateHandler from './cancelPayment';
import oneShotIntentHandler from './oneShotIntent';
import paymentStateHandler from './payment';
import streamStateHandler from './stream';

export default () => [oneShotIntentHandler(), paymentStateHandler(), cancelPaymentStateHandler(), streamStateHandler()];
