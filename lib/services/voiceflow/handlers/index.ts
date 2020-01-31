import AccountLinkingHandler, { AccountLinkingResponseBuilder } from './accountLinking';
import CaptureHandler from './capture';
import CardHandler, { CardResponseBuilder } from './card';
import InteractionHandler from './interaction';
import PaymentHandler, { PaymentResponseBuilder } from './payment';
import PermissionCardHandler, { PermissionCardResponseBuilder } from './permissionCard';
import SpeakHandler from './speak';
import StateHandlers from './state';
import UserInfoHandler from './userInfo';

export const responseHandlers = [CardResponseBuilder, AccountLinkingResponseBuilder, PermissionCardResponseBuilder, PaymentResponseBuilder];
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
];
export type Block = Capture | Interaction | Speak;

export default [SpeakHandler, InteractionHandler, CaptureHandler] as Handler<Block>[];
