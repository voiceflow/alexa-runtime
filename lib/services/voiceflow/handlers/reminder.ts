import { Node, NodeData, RecurrenceFreq } from '@voiceflow/alexa-types/build/nodes/reminder';
import { NodeID } from '@voiceflow/general-types';
import { HandlerFactory, replaceVariables } from '@voiceflow/runtime';
import { HandlerInput } from 'ask-sdk';
import axios from 'axios';
import moment from 'moment';

import { S, T } from '@/lib/constants';

export enum ReminderType {
  SCHEDULED_ABSOLUTE = 'SCHEDULED_ABSOLUTE',
  SCHEDULED_RELATIVE = 'SCHEDULED_RELATIVE',
}

type Trigger =
  | {
      type: ReminderType.SCHEDULED_ABSOLUTE;
      scheduledTime: string;
      recurrence?: {
        byDay?: string[];
        freq: RecurrenceFreq;
      };
      timeZoneId?: string;
    }
  | {
      type: ReminderType.SCHEDULED_RELATIVE;
      offsetInSeconds?: number;
    }
  | null;

const _deriveSeconds = (text: string, multiplier = 1): number => {
  const number = parseInt(text, 10);

  if (Number.isNaN(number)) {
    return 0;
  }

  return number * multiplier;
};

export const _createReminderObject = (reminder: NodeData['reminder'], variablesMap: Record<string, any>, locale: string) => {
  if (reminder.type !== ReminderType.SCHEDULED_ABSOLUTE && reminder.type !== ReminderType.SCHEDULED_RELATIVE)
    throw new Error('invalid reminder type');

  const reminderObject = {
    requestTime: new Date().toISOString(),
    alertInfo: {
      spokenInfo: {
        content: [
          {
            locale,
            text: replaceVariables(reminder.text, variablesMap),
          },
        ],
      },
    },
    pushNotification: {
      status: 'ENABLED',
    },
    trigger: null as Trigger,
  };

  const seconds = Math.round(
    _deriveSeconds(replaceVariables(reminder.time.h, variablesMap), 3600) +
      _deriveSeconds(replaceVariables(reminder.time.m, variablesMap), 60) +
      _deriveSeconds(replaceVariables(reminder.time.s, variablesMap))
  );

  if (reminder.type === ReminderType.SCHEDULED_ABSOLUTE) {
    const date = reminder.date && replaceVariables(reminder.date, variablesMap);

    const time = date?.includes('/') ? moment.utc(date, 'DD/MM/YYYY') : moment.utc(date?.split('T')[0], 'YYYY-MM-DD');

    if (!time.isValid()) throw new Error('invalid date');
    else time.add(seconds, 's');

    reminderObject.trigger = {
      type: reminder.type,
      scheduledTime: time.toISOString().split('.')[0],
    };

    if (reminder.recurrence) {
      reminderObject.trigger.recurrence = reminder.recurrence;
    }
    if (reminder.timezone !== 'User Timezone') reminderObject.trigger.timeZoneId = reminder.timezone;
  } else {
    // ReminderType.SCHEDULED_RELATIVE
    if (seconds < 1) throw new Error('invalid relative seconds');

    reminderObject.trigger = {
      type: reminder.type,
      offsetInSeconds: seconds,
    };
  }

  return reminderObject;
};

const utilsObj = {
  _createReminderObject,
  axios,
};

export const ReminderHandler: HandlerFactory<Node, typeof utilsObj> = (utils) => ({
  canHandle: (node) => {
    return !!node.reminder;
  },
  handle: async (node, context, variables) => {
    let nextId: NodeID;

    try {
      const handlerInput = context.turn.get(T.HANDLER_INPUT) as HandlerInput;
      const { apiEndpoint, apiAccessToken } = handlerInput.requestEnvelope.context.System;

      if (!apiEndpoint || !apiAccessToken) throw new Error('invalid login token');

      const reminderObject = utils._createReminderObject(node.reminder, variables.getState(), context.storage.get<string>(S.LOCALE)!);

      await utils.axios.post(`${apiEndpoint}/v1/alerts/reminders`, reminderObject, {
        headers: {
          Authorization: `Bearer ${apiAccessToken}`,
          'Content-Type': 'application/json',
        },
      });

      nextId = node.success_id ?? null;
    } catch (err) {
      nextId = node.fail_id ?? null;
    }

    return nextId;
  },
});

export default () => ReminderHandler(utilsObj);
