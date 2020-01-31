import { Handler } from '@voiceflow/client';

import AccountLinkingHandler from './accountLinking';
import CaptureHandler, { Capture } from './capture';
import InteractionHandler, { Interaction } from './interaction';
import PermissionCardHandler from './permissionCard';
import SpeakHandler, { Speak } from './speak';
import UserInfoHandler from './userInfo';

export type Block = Capture | Interaction | Speak;

export default [SpeakHandler, InteractionHandler, CaptureHandler] as Handler<Block>[];
