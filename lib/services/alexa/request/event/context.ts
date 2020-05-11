import { Command, Context, extractFrameCommand, Frame, Store } from '@voiceflow/client';

import { F, T } from '@/lib/constants';
import { IntentName, IntentRequest, Mapping, RequestType } from '@/lib/services/voiceflow/types';
import { mapSlots } from '@/lib/services/voiceflow/utils';

export const _getEvent = (context: Context, extractFrame: typeof extractFrameCommand) => {
  const request = context.turn.get(T.REQUEST) as IntentRequest;

  if (request?.type !== RequestType.INTENT) return null;

  const { intent } = request.payload;
  const intentName = intent.name;

  // don't act on a catchall intent
  if (intentName === IntentName.VOICEFLOW) return null;

  const matcher = (command: Command | null) => command?.intent === intentName;

  // If Cancel Intent is not handled turn it into Stop Intent
  // This first loop is AMAZON specific, if cancel intent is not explicitly used anywhere at all, map it to stop intent
  if (intentName === IntentName.CANCEL) {
    const found = context.stack.getFrames().some((frame) => frame.getCommands().some(matcher));

    if (!found) {
      request.payload.intent.name = IntentName.STOP;
      context.turn.set(T.REQUEST, request);
    }
  }

  const res = extractFrame(context.stack, matcher);
  if (!res) return null;

  return {
    ...res,
    intent,
  };
};
export const getEvent = (context: Context) => _getEvent(context, extractFrameCommand);

const utilsObj = {
  getEvent,
  mapSlots,
  Frame,
};

export const handleEvent = (utils: typeof utilsObj) => (context: Context): string | null => {
  // TODO
};

export default handleEvent(utilsObj);
