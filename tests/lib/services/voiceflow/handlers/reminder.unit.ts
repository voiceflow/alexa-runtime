/* eslint-disable max-nested-callbacks */
import { expect } from 'chai';
import sinon from 'sinon';

import { S, T } from '@/lib/constants';
import { _createReminderObject, ReminderHandler, ReminderType } from '@/lib/services/voiceflow/handlers/reminder';

describe('reminder handler unit test', () => {
  describe('canHandle', () => {
    it('false', () => {
      expect(ReminderHandler(null as any).canHandle({} as any, null as any, null as any, null as any)).to.eql(false);
    });

    it('true', () => {
      expect(ReminderHandler(null as any).canHandle({ reminder: {} } as any, null as any, null as any, null as any)).to.eql(true);
    });
  });

  describe('handle', () => {
    it('no apiEndpoint', async () => {
      const input = { requestEnvelope: { context: { System: {} } } };
      const context = { turn: { get: sinon.stub().returns(input) } };

      const block = { fail_id: 'fail-id' };
      expect(await ReminderHandler(null as any).handle(block as any, context as any, null as any, null as any)).to.eql(block.fail_id);
      expect(context.turn.get.args).to.eql([[T.HANDLER_INPUT]]);
    });

    it('no apiAccessToken', async () => {
      const input = { requestEnvelope: { context: { System: { apiEndpoint: 'endpoint' } } } };
      const context = { turn: { get: sinon.stub().returns(input) } };

      const block = { fail_id: 'fail-id' };
      expect(await ReminderHandler(null as any).handle(block as any, context as any, null as any, null as any)).to.eql(block.fail_id);
    });

    it('works correctly', async () => {
      const reminderObject = { foo: 'bar' };
      const utils = { _createReminderObject: sinon.stub().returns(reminderObject), axios: { post: sinon.stub() } };
      const handler = ReminderHandler(utils as any);

      const apiEndpoint = 'apiEndpoint';
      const apiAccessToken = 'apiAccessToken';
      const input = { requestEnvelope: { context: { System: { apiEndpoint, apiAccessToken } } } };
      const locale = 'en';
      const context = { turn: { get: sinon.stub().returns(input) }, storage: { get: sinon.stub().returns(locale) } };
      const block = { success_id: 'success-id', reminder: 'reminder' };
      const variablesState = 'variables';
      const variables = { getState: sinon.stub().returns(variablesState) };

      expect(await handler.handle(block as any, context as any, variables as any, null as any)).to.eql(block.success_id);
      expect(variables.getState.callCount).to.eql(1);
      expect(context.storage.get.args).to.eql([[S.LOCALE]]);
      expect(utils._createReminderObject.args).to.eql([[block.reminder, variablesState, locale]]);
      expect(utils.axios.post.args).to.eql([
        [
          `${apiEndpoint}/v1/alerts/reminders`,
          reminderObject,
          {
            headers: {
              Authorization: `Bearer ${apiAccessToken}`,
              'Content-Type': 'application/json',
            },
          },
        ],
      ]);
    });
  });

  describe('_createReminderObject', () => {
    it('wrong type', async () => {
      expect(() => _createReminderObject({ type: 'random' } as any, null as any, null as any)).to.throw('invalid reminder type');
    });

    describe('correct type', () => {
      describe('scheduled relative', () => {
        it('works correctly', () => {
          const requestTime = new Date().toISOString();
          const stub = sinon.stub(Date.prototype, 'toISOString').returns(requestTime);

          const locale = 'en';
          const variablesMap = { hours: 15 };
          const reminder = {
            text: 'text',
            type: ReminderType.SCHEDULED_RELATIVE,
            time: {
              h: '{hours}',
              m: '16',
              s: '17',
            },
          };
          const result = _createReminderObject(reminder as any, variablesMap, locale);
          expect(result).to.eql({
            requestTime,
            alertInfo: { spokenInfo: { content: [{ locale, text: reminder.text }] } },
            pushNotification: { status: 'ENABLED' },
            trigger: {
              type: reminder.type,
              offsetInSeconds: variablesMap.hours * 60 * 60 + parseInt(reminder.time.m, 10) * 60 + parseInt(reminder.time.s, 10),
            },
          });
          stub.restore();
        });

        it('no seconds', () => {
          const locale = 'en';
          const variablesMap = { hours: 15 };
          const reminder = {
            text: 'text',
            type: ReminderType.SCHEDULED_RELATIVE,
            time: {
              h: '0',
              m: '0',
              s: '0',
            },
          };
          expect(() => _createReminderObject(reminder as any, variablesMap, locale)).to.throw('invalid relative seconds');
        });
      });

      describe('scheduled absolute', () => {
        it('DD/MM/YYYY format', () => {
          const locale = 'en';
          const reminder = {
            text: 'text',
            timezone: 'User Timezone',
            type: ReminderType.SCHEDULED_ABSOLUTE,
            date: '01/02/2023',
            time: {
              h: '1',
              m: '2',
              s: '3',
            },
          };
          const result = _createReminderObject(reminder as any, null as any, locale);
          expect(result.trigger).to.eql({
            type: reminder.type,
            scheduledTime: '2023-02-01T01:02:03',
          });
        });

        it('YYYY-MM-DD format', () => {
          const locale = 'en';
          const reminder = {
            text: 'text',
            timezone: 'America/New York',
            recurrence: 'daily',
            type: ReminderType.SCHEDULED_ABSOLUTE,
            date: '2023-02-01T00:00:00',
            time: {
              h: '1',
              m: '2',
              s: 'wrong',
            },
          };
          const result = _createReminderObject(reminder as any, null as any, locale);
          expect(result.trigger).to.eql({
            type: reminder.type,
            scheduledTime: '2023-02-01T01:02:00',
            timeZoneId: 'America/New York',
            recurrence: 'daily',
          });
        });

        it('format with variables', () => {
          const locale = 'en';
          const reminder = {
            text: 'text',
            timezone: 'User Timezone',
            type: ReminderType.SCHEDULED_ABSOLUTE,
            date: '01/{reminder_month}/{reminder_year}',
            time: {
              h: '1',
              m: '2',
              s: '3',
            },
          };
          const result = _createReminderObject(reminder as any, { reminder_month: '02', reminder_year: '2023' }, locale);
          expect(result.trigger).to.eql({
            type: reminder.type,
            scheduledTime: '2023-02-01T01:02:03',
          });
        });

        it('no date', () => {
          const locale = 'en';
          const reminder = {
            text: 'text',
            timezone: 'America/New York',
            recurrence: 'daily',
            type: ReminderType.SCHEDULED_ABSOLUTE,
            date: null,
            time: {
              h: '1',
              m: '2',
              s: 'wrong',
            },
          };
          expect(() => _createReminderObject(reminder as any, null as any, locale)).to.throw('invalid date');
        });
      });
    });
  });
});
