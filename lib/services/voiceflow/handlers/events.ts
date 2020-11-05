import { EventCallback, EventType } from '@voiceflow/runtime';
import Promise from 'bluebird';

import { events as displayEvents } from './display';

type ExecuteMap = { [key in EventType]: EventCallback<key>[] };

const executeMap: Partial<ExecuteMap> = {
  [EventType.stateDidExecute]: [displayEvents.stateDidExecute],
};

export const executeEvents = <E extends EventType>(eventType: E): EventCallback<E> =>
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  (event) => Promise.each(executeMap[eventType] || [], (callback) => callback(event));

export default executeMap;
