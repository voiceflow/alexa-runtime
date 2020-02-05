import { Handler } from '@voiceflow/client';
import { HandlerInput } from 'ask-sdk';
import axios from 'axios';
import moment from 'moment';

import { S, T } from '@/lib/constants';

import { regexVariables } from '../utils';

export type Reminder = {
  reminder: string;
  success_id: string;
  fail_id: string;
};

const _deriveSeconds = (text, multiplier = 1): number => {
  const number = parseInt(text, 10);
  if (Number.isNaN(number)) return 0;

  return number * multiplier;
};

const _createReminderObject = (reminder, variablesMap: Record<string, any>, locale: string) => {
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
    trigger: null,
  };

  const seconds = Math.round(
    _deriveSeconds(regexVariables(reminder.time.h, variablesMap), 3600) +
      _deriveSeconds(regexVariables(reminder.time.m, variablesMap), 60) +
      _deriveSeconds(regexVariables(reminder.time.s, variablesMap))
  );

  if (reminder.type === 'SCHEDULED_ABSOLUTE') {
    let { date } = reminder;
    if (date.includes('/')) {
      date = moment.utc(date, 'DD/MM/YYYY');
    } else {
      [date] = date.split('T');
      date = moment.utc(date, 'YYYY-MM-DD');
    }
    if (!date.isValid()) {
      throw new Error('Invalid Date');
    } else {
      date.add(seconds, 's');
    }
    reminderObject.trigger = {
      type: 'SCHEDULED_ABSOLUTE',
      scheduledTime: date.toISOString().split('.')[0],
    };

    if (reminder.recurrence) {
      reminderObject.trigger.recurrence = reminder.recurrence;
    }

    if (reminder.timezone !== 'User Timezone') {
      reminderObject.trigger.timeZoneId = reminder.timezone;
    }
    return reminderObject;
  }
  if (reminder.type === 'SCHEDULED_RELATIVE') {
    if (seconds < 1) {
      throw new Error('Invalid Relative Seconds');
    }
    reminderObject.trigger = {
      type: 'SCHEDULED_RELATIVE',
      offsetInSeconds: seconds,
    };

    return reminderObject;
  }

  throw new Error('Invalid Reminder Type');
};

const ReminderHandler: Handler<Reminder> = {
  canHandle: (block) => {
    return !!block.reminder;
  },
  handle: async (block, context, variables) => {
    let nextId: string;

    try {
      const handlerInput = context.turn.get(T.HANDLER_INPUT) as HandlerInput;
      const { apiEndpoint, apiAccessToken } = handlerInput.requestEnvelope.context.System;

      if (!apiEndpoint || !apiAccessToken) throw new Error('Invalid Login Token');

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
