import { Command } from '@voiceflow/api-sdk';
import { extractFrameCommand } from '@voiceflow/runtime';

import { T } from '@/lib/constants';
import { AlexaRuntime, EventRequest, RequestType } from '@/lib/services/runtime/types';

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

export const _getEvent = (runtime: AlexaRuntime, extractFrame: typeof extractFrameCommand) => {
  const request = runtime.getRequest();

  if (request?.type !== RequestType.EVENT) return null;

  const { event } = request.payload;

  const res = extractFrame<EventCommand>(runtime.stack, (command: EventCommand | null) => command?.event === event);

  if (!res) return null;

  return {
    index: res.index,
    command: res.command,
    event,
  };
};

export const getEvent = (runtime: AlexaRuntime) => _getEvent(runtime, extractFrameCommand);

const utilsObj = {
  getEvent,
};

export const handleEvent = (utils: typeof utilsObj) => async (runtime: AlexaRuntime): Promise<void> => {
  const event = utils.getEvent(runtime);
  if (!event) return;

  const { index, command } = event;
  const request = runtime.getRequest() as EventRequest;

  runtime.stack.popTo(index + 1);
  runtime.stack.top().setNodeID(command.next);

  runtime.turn.set(T.REQUEST, false);

  command.mappings.forEach((mapping) => {
    runtime.variables.set(mapping.var, getVariable(mapping.path, request.payload.data));
  });
};

export default handleEvent(utilsObj);
