import { Handler } from '@voiceflow/client';

import AccountLinkingHandler, { AccountLinking } from './accountLinking';
import CaptureHandler, { Capture } from './capture';
import InteractionHandler, { Interaction } from './interaction';
import PermissionCardHandler, { PermissionCard } from './permissionCard';
import SpeakHandler, { Speak } from './speak';
import UserInfoHandler, { UserInfo } from './userInfo';

export type Block = Capture | Interaction | Speak | AccountLinking | PermissionCard | UserInfo;

export default [SpeakHandler, InteractionHandler, CaptureHandler, AccountLinkingHandler, PermissionCardHandler, UserInfoHandler] as Handler<Block>[];
