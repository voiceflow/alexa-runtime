import AccountLinkingHandler, { AccountLinkingResponseBuilder } from './accountLinking';
import CancelPaymentHandler, { CancelPaymentResponseBuilder } from './cancelPayment';
import CaptureHandler from './capture';
import CardHandler, { CardResponseBuilder } from './card';
import InteractionHandler from './interaction';
import PaymentHandler, { PaymentResponseBuilder } from './payment';
import PermissionCardHandler, { PermissionCardResponseBuilder } from './permissionCard';
import ReminderHandler from './reminder';
import ResetHandler from './reset';
import SpeakHandler from './speak';
import StateHandlers from './state';
import StreamHandler, { StreamResponseBuilder } from './stream';
import UserInfoHandler from './userInfo';

export const responseHandlers = [
  CardResponseBuilder,
  AccountLinkingResponseBuilder,
  PermissionCardResponseBuilder,
  PaymentResponseBuilder,
  CancelPaymentResponseBuilder,
  StreamResponseBuilder,
];

export default [
  ...StateHandlers,
  SpeakHandler,
  InteractionHandler,
  CaptureHandler,
  AccountLinkingHandler,
  PermissionCardHandler,
  UserInfoHandler,
  CardHandler,
  PaymentHandler,
  CancelPaymentHandler,
  ReminderHandler,
  ResetHandler,
  StreamHandler,
];
