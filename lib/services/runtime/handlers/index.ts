import {
  EndHandler,
  FlowHandler,
  IfHandler,
  IntegrationsHandler,
  NextHandler,
  RandomHandler,
  ResetHandler,
  SetHandler,
  StartHandler,
} from '@voiceflow/runtime';

import { Config } from '@/types';

import AccountLinkingHandler, { AccountLinkingResponseBuilder } from './accountLinking';
import CancelPaymentHandler, { CancelPaymentResponseBuilder } from './cancelPayment';
import CaptureHandler from './capture';
import CardHandler, { CardResponseBuilder } from './card';
import CodeHandler from './code';
import DirectiveHandler, { DirectiveResponseBuilder } from './directive';
import DisplayHandler, { DisplayResponseBuilder } from './display';
import DisplayHandlerV2 from './displayV2';
import InteractionHandler from './interaction';
import PaymentHandler, { PaymentResponseBuilder } from './payment';
import PermissionCardHandler, { PermissionCardResponseBuilder } from './permissionCard';
import ReminderHandler from './reminder';
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
  DisplayResponseBuilder,
  StreamResponseBuilder,
  DirectiveResponseBuilder,
];

export default ({ API_HANDLER_ENDPOINT, INTEGRATIONS_HANDLER_ENDPOINT, CODE_HANDLER_ENDPOINT }: Config) => [
  ...StateHandlers(),
  SpeakHandler(),
  DirectiveHandler(),
  InteractionHandler(),
  CaptureHandler(),
  AccountLinkingHandler(),
  PermissionCardHandler(),
  UserInfoHandler(),
  CardHandler(),
  PaymentHandler(),
  CancelPaymentHandler(),
  ReminderHandler(),
  ResetHandler(),
  DisplayHandler(),
  DisplayHandlerV2(),
  StreamHandler(),
  CodeHandler({ endpoint: CODE_HANDLER_ENDPOINT }),
  EndHandler(),
  FlowHandler(),
  IfHandler(),
  IntegrationsHandler({ customAPIEndpoint: API_HANDLER_ENDPOINT, integrationsLambdaEndpoint: INTEGRATIONS_HANDLER_ENDPOINT }),
  RandomHandler(),
  SetHandler(),
  StartHandler(),
  NextHandler(),
];
