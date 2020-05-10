import { CodeHandler, EndHandler, FlowHandler, IfHandler, IntegrationsHandler, RandomHandler, SetHandler, StartHandler } from '@voiceflow/client';

import AccountLinkingHandler from '@/lib/services/voiceflow/handlers/accountLinking';
import CaptureHandler from '@/lib/services/voiceflow/handlers/capture';
import CardHandler from '@/lib/services/voiceflow/handlers/card';
import DirectiveHandler from '@/lib/services/voiceflow/handlers/directive';
import InteractionHandler from '@/lib/services/voiceflow/handlers/interaction';
import PermissionCardHandler from '@/lib/services/voiceflow/handlers/permissionCard';
import ResetHandler from '@/lib/services/voiceflow/handlers/reset';
import SpeakHandler from '@/lib/services/voiceflow/handlers/speak';
import StreamStateHandler from '@/lib/services/voiceflow/handlers/state/stream';
import StreamHandler from '@/lib/services/voiceflow/handlers/stream';
import { Config } from '@/types';

import CancelPaymentHandler from './cancelPayment';
import ChoiceHandler from './choice';
import DisplayHandler from './display';
import PaymentHandler from './payment';
import ReminderHandler from './reminder';
import UserInfoHandler from './userInfo';

export default ({ API_HANDLER_ENDPOINT, INTEGRATIONS_HANDLER_ENDPOINT, CODE_HANDLER_ENDPOINT }: Config) => [
  StreamStateHandler(),
  SpeakHandler(),
  InteractionHandler(),
  CaptureHandler(),
  AccountLinkingHandler(),
  PermissionCardHandler(),
  UserInfoHandler(),
  CardHandler(),
  DirectiveHandler(),
  PaymentHandler(),
  CancelPaymentHandler(),
  ReminderHandler(),
  ResetHandler(),
  DisplayHandler(),
  StreamHandler(),
  ChoiceHandler(),
  CodeHandler({ endpoint: CODE_HANDLER_ENDPOINT }),
  EndHandler(),
  FlowHandler(),
  IfHandler(),
  IntegrationsHandler({ customAPIEndpoint: API_HANDLER_ENDPOINT, integrationsLambdaEndpoint: INTEGRATIONS_HANDLER_ENDPOINT }),
  RandomHandler(),
  SetHandler(),
  StartHandler(),
];
