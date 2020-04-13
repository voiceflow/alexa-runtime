import { expect } from 'chai';
import sinon from 'sinon';

import AlexaManager, { ResponseInterceptor } from '@/lib/services/alexa';

describe('alexa manager unit tests', () => {
  describe('skill', () => {
    it('builds skill correctly', () => {
      const output = 'output';
      const create = sinon.stub().returns(output);
      const withAutoCreateTable = sinon.stub().returns({ create });
      const withTableName = sinon.stub().returns({ withAutoCreateTable });
      const withDynamoDbClient = sinon.stub().returns({ withTableName });
      const addResponseInterceptors = sinon.stub().returns({ withDynamoDbClient });
      const addErrorHandlers = sinon.stub().returns({ addResponseInterceptors });
      const addRequestHandlers = sinon.stub().returns({ addErrorHandlers });
      const services = {
        dynamo: 'dynamo',
      };
      const utils = {
        handlers: {
          LaunchHandler: 'LaunchHandler',
          IntentHandler: 'IntentHandler',
          SessionEndedHandler: 'SessionEndedHandler',
          PlaybackControllerHandler: 'PlaybackControllerHandler',
          AudioPlayerEventHandler: 'AudioPlayerEventHandler',
          EventHandler: 'EventHandler',
          PurchaseHandler: 'PurchaseHandler',
          APLUserEventHandler: 'APLUserEventHandler',
          CancelPurchaseHandler: 'CancelPurchaseHandler',
          ErrorHandler: 'ErrorHandler',
        },
        interceptors: { ResponseInterceptor: 'ResponseInterceptor' },
        builder: { standard: sinon.stub().returns({ addRequestHandlers }) },
      };
      const config = { SESSIONS_DYNAMO_TABLE: 'SESSIONS_DYNAMO_TABLE' };

      const alexaManager = AlexaManager(services as any, config as any, utils as any);

      expect(alexaManager.skill).to.eql(output);
      expect(utils.builder.standard.callCount).to.eql(1);
      expect(addRequestHandlers.args).to.eql([
        [
          utils.handlers.LaunchHandler,
          utils.handlers.IntentHandler,
          utils.handlers.SessionEndedHandler,
          utils.handlers.PlaybackControllerHandler,
          utils.handlers.AudioPlayerEventHandler,
          utils.handlers.EventHandler,
          utils.handlers.PurchaseHandler,
          utils.handlers.APLUserEventHandler,
          utils.handlers.CancelPurchaseHandler,
        ],
      ]);
      expect(addErrorHandlers.args).to.eql([[utils.handlers.ErrorHandler]]);
      expect(addResponseInterceptors.args).to.eql([[utils.interceptors.ResponseInterceptor]]);
      expect(withDynamoDbClient.args).to.eql([[services.dynamo]]);
      expect(withTableName.args).to.eql([[config.SESSIONS_DYNAMO_TABLE]]);
      expect(withAutoCreateTable.args).to.eql([[false]]);
      expect(create.callCount).to.eql(1);
    });
  });

  describe('ResponseInterceptor', () => {
    describe('process', () => {
      it('works correctly', async () => {
        const input = {
          attributesManager: { savePersistentAttributes: sinon.stub().resolves() },
        };

        await ResponseInterceptor.process(input as any);

        expect(input.attributesManager.savePersistentAttributes.callCount).to.eql(1);
      });
    });
  });
});
