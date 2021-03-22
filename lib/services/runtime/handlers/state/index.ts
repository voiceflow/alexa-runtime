import cancelPaymentStateHandler from './cancelPayment';
import oneShotIntentHandler from './oneShotIntent';
import paymentStateHandler from './payment';
import preliminaryHandler from './preliminary';
import streamStateHandler from './stream';

export default () => [oneShotIntentHandler(), paymentStateHandler(), cancelPaymentStateHandler(), streamStateHandler(), preliminaryHandler()];
