import AccountLinkingHandler, { AccountLinkingResponseBuilder } from './accountLinking';
import CaptureHandler from './capture';
import CardHandler, { CardResponseBuilder } from './card';
import InteractionHandler from './interaction';
import PermissionCardHandler, { PermissionCardResponseBuilder } from './permissionCard';
import SpeakHandler from './speak';
import UserInfoHandler from './userInfo';

export const responseHandlers = [CardResponseBuilder, AccountLinkingResponseBuilder, PermissionCardResponseBuilder];
export default [SpeakHandler, InteractionHandler, CaptureHandler, AccountLinkingHandler, PermissionCardHandler, UserInfoHandler, CardHandler];
