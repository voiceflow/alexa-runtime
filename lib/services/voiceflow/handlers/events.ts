import { Context, Event, EventCallback } from '@voiceflow/client';
import Promise from 'bluebird';

import { events as displayEvents } from './display';

type EventsMap = Partial<Record<Event, EventCallback[]>>;

const eventsMap: EventsMap = {
  [Event.stateDidExecute]: [displayEvents.stateDidExecute],
};

export const executeEvents = (event: Event, context: Context, ...args: any[]) =>
  Promise.each(eventsMap[event] || [], (callback) => callback(context, ...args));

export default eventsMap;
