import { expect } from 'chai';
import sinon from 'sinon';

import AlexaManager, { RequestInterceptorGenerator, ResponseInterceptor } from '@/lib/services/alexa';

describe('alexa manager unit tests', () => {
  describe('skill', () => {
    it('builds skill correctly', () => {
      const output = 'output';
      const create = sinon.stub().returns(output);
      const withAutoCreateTable = sinon.stub().returns({ create });
      const withTableName = sinon.stub().returns({ withAutoCreateTable });
      const withDynamoDbClient = sinon.stub().returns({ withTableName });
      const addResponseInterceptors = sinon.stub().returns({ withDynamoDbClient });
      const addRequestInterceptors = sinon.stub().returns({ addResponseInterceptors });
      const addErrorHandlers = sinon.stub().returns({ addRequestInterceptors });
      const addRequestHandlers = sinon.stub().returns({ addErrorHandlers });
      const services = {
        dynamo: 'dynamo',
        metrics: 'metrics',
        adapter: 'adapter',
      };
      const utils = {
        handlers: {
          EventHandler: 'EventHandler',
          LaunchHandler: 'LaunchHandler',
          IntentHandler: 'IntentHandler',
          SessionEndedHandler: 'SessionEndedHandler',
          PlaybackControllerHandler: 'PlaybackControllerHandler',
          AudioPlayerEventHandler: 'AudioPlayerEventHandler',
          PermissionHandler: 'PermissionHandler',
          PurchaseHandler: 'PurchaseHandler',
          APLUserEventHandler: 'APLUserEventHandler',
          CancelPurchaseHandler: 'CancelPurchaseHandler',
          CanFulfillmentRequestHandler: 'CanFulfillmentRequestHandler',
          ErrorHandlerGenerator: sinon.stub().returns('ErrorHandler'),
        },
        interceptors: { ResponseInterceptor: 'ResponseInterceptor', RequestInterceptorGenerator: sinon.stub().returns('RequestInterceptor') },
        builder: { standard: sinon.stub().returns({ addRequestHandlers }) },
      };
      const config = { SESSIONS_DYNAMO_TABLE: 'SESSIONS_DYNAMO_TABLE' };

      const alexaManager = AlexaManager(services as any, config as any, utils as any);

      expect(alexaManager.skill).to.eql(output);
      expect(utils.builder.standard.callCount).to.eql(1);
      expect(addRequestHandlers.args).to.eql([
        [
          utils.handlers.EventHandler,
          utils.handlers.LaunchHandler,
          utils.handlers.IntentHandler,
          utils.handlers.SessionEndedHandler,
          utils.handlers.PlaybackControllerHandler,
          utils.handlers.AudioPlayerEventHandler,
          utils.handlers.PermissionHandler,
          utils.handlers.PurchaseHandler,
          utils.handlers.APLUserEventHandler,
          utils.handlers.CancelPurchaseHandler,
          utils.handlers.CanFulfillmentRequestHandler,
        ],
      ]);
      expect(addErrorHandlers.args).to.eql([[utils.handlers.ErrorHandlerGenerator()]]);
      expect(addRequestInterceptors.args).to.eql([[utils.interceptors.RequestInterceptorGenerator()]]);
      expect(addResponseInterceptors.args).to.eql([[utils.interceptors.ResponseInterceptor]]);
      expect(withDynamoDbClient.args).to.eql([[services.dynamo]]);
      expect(withTableName.args).to.eql([[config.SESSIONS_DYNAMO_TABLE]]);
      expect(withAutoCreateTable.args).to.eql([[false]]);
      expect(create.callCount).to.eql(1);

      expect(utils.handlers.ErrorHandlerGenerator.args[0]).to.eql([services.metrics]);
      expect(utils.interceptors.RequestInterceptorGenerator.args[0]).to.eql([services.metrics, services.adapter]);
    });
  });

  describe('RequestInterceptor', () => {
    describe('process', () => {
      it('works correctly', async () => {
        const versionID = '1';

        const input = {
          context: { versionID },
        };

        const metrics = { invocation: sinon.stub() };
        const adapter = { context: sinon.stub() };

        await RequestInterceptorGenerator(metrics as any, adapter as any).process(input as any);

        expect(metrics.invocation.args).to.eql([[versionID]]);
        expect(adapter.context.args).to.eql([[input]]);
      });
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
