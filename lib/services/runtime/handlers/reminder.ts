import { AlexaNode } from '@voiceflow/alexa-types';
import { BaseNode } from '@voiceflow/base-types';
import { replaceVariables } from '@voiceflow/common';
import { HandlerFactory } from '@voiceflow/general-runtime/build/runtime';
import axios from 'axios';
import dayjs from 'dayjs';

import { S, T } from '@/lib/constants';
import { AlexaHandlerInput } from '@/lib/services/alexa/types';

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
        freq: AlexaNode.Reminder.RecurrenceFreq;
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

// eslint-disable-next-line sonarjs/cognitive-complexity
export const _createReminderObject = (reminder: AlexaNode.Reminder.NodeReminder, variablesMap: Record<string, any>, locale: string) => {
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

    let time = date?.includes('/') ? dayjs.utc(date, 'DD/MM/YYYY') : dayjs.utc(date?.split('T')[0], 'YYYY-MM-DD');

    if (!time.isValid()) throw new Error('invalid date');
    else time = time.add(seconds, 's');

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

export const ReminderHandler: HandlerFactory<AlexaNode.Reminder.Node, typeof utilsObj> = (utils) => ({
  canHandle: (node) => {
    return !!node.reminder;
  },
  handle: async (node, runtime, variables) => {
    let nextId: BaseNode.Utils.NodeID;

    try {
      const handlerInput = runtime.turn.get<AlexaHandlerInput>(T.HANDLER_INPUT);
      const { apiEndpoint, apiAccessToken } = handlerInput?.requestEnvelope.context.System ?? {};

      if (!apiEndpoint || !apiAccessToken) throw new Error('invalid login token');

      const reminderObject = utils._createReminderObject(node.reminder, variables.getState(), runtime.storage.get<string>(S.LOCALE)!);

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
