import { Command } from '@voiceflow/api-sdk';
import { Context, extractFrameCommand } from '@voiceflow/runtime';

import { EventRequest, RequestType } from '@/lib/services/voiceflow/types';

export type EventCommand = Command<'event', { event: string; next: string | null; mappings: { path: string; var: string }[] }>;

export const getVariable = (path: string, data: any) => {
  if (!path || typeof path !== 'string') {
    return undefined;
  }
  const props = path.split('.');
  let curData: any = { data };

  props.forEach((prop) => {
    const propsAndInds = prop.split('[');
    propsAndInds.forEach((propOrInd) => {
      if (propOrInd.indexOf(']') >= 0) {
        const indexStr = propOrInd.slice(0, -1);
        let index;
        if (indexStr.toLowerCase() === '{random}') {
          index = Math.floor(Math.random() * curData.length);
        } else {
          index = parseInt(indexStr, 10);
        }
        curData = curData ? curData[index] : undefined;
      } else {
        curData = curData ? curData[propOrInd] : undefined;
      }
    });
  });

  // eslint-disable-next-line no-restricted-globals
  return !isNaN(curData) && curData.length < 16 ? +curData : curData;
};

export const _getEvent = (context: Context, extractFrame: typeof extractFrameCommand) => {
  const request = context.getRequest() as EventRequest;

  if (request?.type !== RequestType.EVENT) return null;

  const { event } = request.payload;

  const res = extractFrame<EventCommand>(context.stack, (command: EventCommand | null) => command?.event === event);
  if (!res) return null;

  return {
    index: res.index,
    command: res.command,
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
  const request = context.getRequest() as EventRequest;

  context.stack.popTo(index + 1);
  context.stack.top().setNodeID(command.next);

  command.mappings.forEach((mapping) => {
    context.variables.set(mapping.var, getVariable(mapping.path, request.payload.data));
  });
};

export default handleEvent(utilsObj);
