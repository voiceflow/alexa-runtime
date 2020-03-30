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
        utils: {
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
        },
        dynamo: 'dynamo',
      };
      const config = { SESSIONS_DYNAMO_TABLE: 'SESSIONS_DYNAMO_TABLE' };

      const alexaManager = new AlexaManager(services as any, config as any);

      expect(alexaManager.skill()).to.eql(output);
      expect(services.utils.builder.standard.callCount).to.eql(1);
      expect(addRequestHandlers.args).to.eql([
        [
          services.utils.handlers.LaunchHandler,
          services.utils.handlers.IntentHandler,
          services.utils.handlers.SessionEndedHandler,
          services.utils.handlers.PlaybackControllerHandler,
          services.utils.handlers.AudioPlayerEventHandler,
          services.utils.handlers.EventHandler,
          services.utils.handlers.PurchaseHandler,
          services.utils.handlers.APLUserEventHandler,
          services.utils.handlers.CancelPurchaseHandler,
        ],
      ]);
      expect(addErrorHandlers.args).to.eql([[services.utils.handlers.ErrorHandler]]);
      expect(addResponseInterceptors.args).to.eql([[services.utils.interceptors.ResponseInterceptor]]);
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
