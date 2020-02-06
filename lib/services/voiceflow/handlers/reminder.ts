import { Handler } from '@voiceflow/client';
import { HandlerInput } from 'ask-sdk';
import axios from 'axios';
import moment from 'moment';

import { S, T } from '@/lib/constants';

import { regexVariables } from '../utils';

enum ReminderType {
  SCHEDULED_ABSOLUTE = 'SCHEDULED_ABSOLUTE',
  SCHEDULED_RELATIVE = 'SCHEDULED_RELATIVE',
}

type Reminder = {
  time: { h: string; m: string; s: string };
  type: ReminderType;
  text: string;
  date?: string;
  recurrence?: string;
  timezone?: string;
};

export type ReminderBlock = {
  reminder: Reminder;
  success_id: string;
  fail_id: string;
};

type Trigger =
  | {
      type: ReminderType.SCHEDULED_ABSOLUTE;
      scheduledTime: string;
      recurrence?: string;
      timeZoneId?: string;
    }
  | {
      type: ReminderType.SCHEDULED_RELATIVE;
      offsetInSeconds?: number;
    }
  | null;

const _deriveSeconds = (text: string, multiplier = 1): number => {
  const number = parseInt(text, 10);
  if (Number.isNaN(number)) return 0;

  return number * multiplier;
};

const _createReminderObject = (reminder: Reminder, variablesMap: Record<string, any>, locale: string) => {
  if (reminder.type !== ReminderType.SCHEDULED_ABSOLUTE && reminder.type !== ReminderType.SCHEDULED_RELATIVE)
    throw new Error('invalid reminder type');

  const reminderObject = {
    requestTime: new Date().toISOString(),
    alertInfo: {
      spokenInfo: {
        content: [
          {
            locale,
            text: regexVariables(reminder.text, variablesMap),
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
    _deriveSeconds(regexVariables(reminder.time.h, variablesMap), 3600) +
      _deriveSeconds(regexVariables(reminder.time.m, variablesMap), 60) +
      _deriveSeconds(regexVariables(reminder.time.s, variablesMap))
  );

  if (reminder.type === ReminderType.SCHEDULED_ABSOLUTE) {
    const { date } = reminder;
    const time = date?.includes('/') ? moment.utc(date, 'DD/MM/YYYY') : moment.utc(date?.split('T')[0], 'YYYY-MM-DD');

    if (!time.isValid()) throw new Error('invalid date');
    else time.add(seconds, 's');

    reminderObject.trigger = {
      type: reminder.type,
      scheduledTime: time.toISOString().split('.')[0],
    };

    if (reminder.recurrence) reminderObject.trigger.recurrence = reminder.recurrence;
    if (reminder.timezone !== 'User Timezone') reminderObject.trigger.timeZoneId = reminder.timezone;
  } else if (reminder.type === ReminderType.SCHEDULED_RELATIVE) {
    if (seconds < 1) throw new Error('invalid relative seconds');

    reminderObject.trigger = {
      type: reminder.type,
      offsetInSeconds: seconds,
    };
  }

  return reminderObject;
};

const ReminderHandler: Handler<ReminderBlock> = {
  canHandle: (block) => {
    return !!block.reminder;
  },
  handle: async (block, context, variables) => {
    let nextId: string;

    try {
      const handlerInput = context.turn.get(T.HANDLER_INPUT) as HandlerInput;
      const { apiEndpoint, apiAccessToken } = handlerInput.requestEnvelope.context.System;

      if (!apiEndpoint || !apiAccessToken) throw new Error('invalid login token');

      const reminderObject = _createReminderObject(block.reminder, variables.getState(), context.storage.get(S.LOCALE));

      await axios.post(`${apiEndpoint}/v1/alerts/reminders`, reminderObject, {
        headers: {
          Authorization: `Bearer ${apiAccessToken}`,
          'Content-Type': 'application/json',
        },
      });

      nextId = block.success_id;
    } catch (err) {
      nextId = block.fail_id;
    }

    return nextId;
  },
};

export default ReminderHandler;
