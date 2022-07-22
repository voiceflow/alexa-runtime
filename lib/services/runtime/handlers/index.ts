import {
  APIHandler,
  EndHandler,
  FlowHandler,
  GoToNodeHandler,
  IfHandler,
  IfV2Handler,
  IntegrationsHandler,
  NextHandler,
  RandomHandler,
  ResetHandler,
  SetHandler,
  SetV2Handler,
  StartHandler,
} from '@voiceflow/general-runtime/build/runtime';

import { Config } from '@/types';

import _V1Handler from './_v1';
import AccountLinkingHandler, { AccountLinkingResponseBuilder } from './accountLinking';
import CancelPaymentHandler, { CancelPaymentResponseBuilder } from './cancelPayment';
import CaptureHandler from './capture';
import CaptureV2Handler from './captureV2';
import CardHandler, { CardResponseBuilder } from './card';
import CodeHandler from './code';
import DirectiveHandler, { DirectiveResponseBuilder } from './directive';
import DisplayHandler, { DisplayResponseBuilder } from './display';
import DisplayHandlerV2 from './displayV2';
import GoToHandler from './goTo';
import InteractionHandler from './interaction';
import PaymentHandler, { PaymentResponseBuilder } from './payment';
import PermissionCardHandler, { PermissionCardResponseBuilder } from './permissionCard';
import ReminderHandler from './reminder';
import { DelegateResponseBuilder, ElicitSlotResponseBuilder } from './responseBuilders';
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
  DelegateResponseBuilder,
  ElicitSlotResponseBuilder,
];

const _v1Handler = _V1Handler();

export default ({
  INTEGRATIONS_HANDLER_ENDPOINT,
  CODE_HANDLER_ENDPOINT,
  API_MAX_BODY_LENGTH_BYTES,
  API_MAX_CONTENT_LENGTH_BYTES,
  API_MAX_TIMEOUT_MS,
}: Config) => [
  ...StateHandlers(),
  SpeakHandler(),
  GoToHandler(),
  DirectiveHandler(),
  InteractionHandler(),
  CaptureV2Handler(),
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
  IfV2Handler({ _v1: _v1Handler }),
  APIHandler({
    requestTimeoutMs: API_MAX_TIMEOUT_MS ?? undefined,
    maxResponseBodySizeBytes: API_MAX_CONTENT_LENGTH_BYTES ?? undefined,
    maxRequestBodySizeBytes: API_MAX_BODY_LENGTH_BYTES ?? undefined,
  }),
  IntegrationsHandler({ integrationsEndpoint: INTEGRATIONS_HANDLER_ENDPOINT }),
  RandomHandler(),
  SetHandler(),
  SetV2Handler(),
  GoToNodeHandler(),
  StartHandler(),
  NextHandler(),
  _v1Handler,
];
