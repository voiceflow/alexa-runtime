import { DefaultHandlers } from '@voiceflow/client';

import AccountLinkingHandler from '@/lib/services/voiceflow/handlers/accountLinking';
import CaptureHandler from '@/lib/services/voiceflow/handlers/capture';
import CardHandler from '@/lib/services/voiceflow/handlers/card';
import ChoiceHandler from '@/lib/services/voiceflow/handlers/choice';
import InteractionHandler from '@/lib/services/voiceflow/handlers/interaction';
import PermissionCardHandler from '@/lib/services/voiceflow/handlers/permissionCard';
import ResetHandler from '@/lib/services/voiceflow/handlers/reset';
import SpeakHandler from '@/lib/services/voiceflow/handlers/speak';
import StreamStateHandler from '@/lib/services/voiceflow/handlers/state/stream';
import StreamHandler from '@/lib/services/voiceflow/handlers/stream';

import CancelPaymentHandler from './cancelPayment';
import DisplayHandler from './display';
import PaymentHandler from './payment';
import ReminderHandler from './reminder';
import UserInfoHandler from './userInfo';

export default [
  StreamStateHandler,
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
  DisplayHandler,
  StreamHandler,
  ChoiceHandler,
  ...DefaultHandlers,
];
