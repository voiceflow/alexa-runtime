import { Command, Context, extractFrameCommand } from '@voiceflow/client';

import { EventRequest, RequestType } from '@/lib/services/voiceflow/types';

export const _getEvent = (context: Context, extractFrame: typeof extractFrameCommand) => {
  const request = context.getRequest() as EventRequest;

  if (request?.type !== RequestType.EVENT) return null;

  const { event } = request.payload;

  const res = extractFrame(context.stack, (command: Command | null) => command?.event === event);
  if (!res) return null;

  return {
    ...res,
    event,
  };
};
export const getEvent = (context: Context) => _getEvent(context, extractFrameCommand);

const utilsObj = {
  getEvent,
};

export const handleEvent = (utils: typeof utilsObj) => async (context: Context): Promise<void> => {
  const event = utils.getEvent(context);
  if (!event) return;

  const { index, command } = event;

  context.stack.popTo(index + 1);
  context.stack.top().setBlockID(command.next);
};

export default handleEvent(utilsObj);
