import { BaseModels } from '@voiceflow/base-types';

import { AlexaRuntime, EventRequest, RequestType } from '@/lib/services/runtime/types';

export type EventCommand = BaseModels.Command<
  'event',
  { event: string; next: string | null; mappings: { path: string; var: string }[] }
>;

// eslint-disable-next-line sonarjs/cognitive-complexity
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

export const getEvent = (runtime: AlexaRuntime) => {
  const request = runtime.getRequest();

  if (request?.type !== RequestType.EVENT) return null;

  const { event } = request.payload;

  const frames = runtime.stack.getFrames();
  for (let index = frames.length - 1; index >= 0; index--) {
    const commands = frames[index]?.getCommands<EventCommand>() ?? [];

    // eslint-disable-next-line no-restricted-syntax
    for (const command of commands) {
      if (command?.event === event) {
        return { index, command, event };
      }
    }
  }

  return null;
};

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

  command.mappings.forEach((mapping) => {
    runtime.variables.set(mapping.var, getVariable(mapping.path, request.payload.data));
  });
};

export default handleEvent(utilsObj);
