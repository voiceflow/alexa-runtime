import { expect } from 'chai';
import sinon from 'sinon';

import AlexaManager, { RequestInterceptorGenerator, ResponseInterceptor } from '@/lib/services/alexa';

describe('alexa manager unit tests', () => {
  describe('skill', () => {
    it('builds skill correctly', () => {
      const output = 'output';
      const create = sinon.stub().returns(output);
      const withPersistenceAdapter = sinon.stub().returns({ create });
      const addResponseInterceptors = sinon.stub().returns({ withPersistenceAdapter });
      const addRequestInterceptors = sinon.stub().returns({ addResponseInterceptors });
      const addErrorHandlers = sinon.stub().returns({ addRequestInterceptors });
      const withApiClient = sinon.stub().returns({ addErrorHandlers });
      const addRequestHandlers = sinon.stub().returns({ withApiClient });
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
          ErrorHandlerGenerator: sinon.stub().returns('ErrorHandler'),
        },
        interceptors: { ResponseInterceptor: 'ResponseInterceptor', RequestInterceptorGenerator: sinon.stub().returns('RequestInterceptor') },
        builder: { custom: sinon.stub().returns({ addRequestHandlers }) },
        adapters: {
          CustomDynamoDbPersistenceAdapter: sinon.stub().returns({ foo: 'bar' }),
        },
        APIClient: sinon.stub().returns({ api: 'client' }),
      };
      const config = { SESSIONS_DYNAMO_TABLE: 'SESSIONS_DYNAMO_TABLE' };

      const alexaManager = AlexaManager(services as any, config as any, utils as any);

      expect(alexaManager.skill).to.eql(output);
      expect(utils.builder.custom.callCount).to.eql(1);
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
        ],
      ]);
      expect(withApiClient.args).to.eql([[{ api: 'client' }]]);
      expect(addErrorHandlers.args).to.eql([[utils.handlers.ErrorHandlerGenerator()]]);
      expect(addRequestInterceptors.args).to.eql([[utils.interceptors.RequestInterceptorGenerator()]]);
      expect(addResponseInterceptors.args).to.eql([[utils.interceptors.ResponseInterceptor]]);
      expect(withPersistenceAdapter.args).to.eql([[{ foo: 'bar' }]]);
      expect(create.callCount).to.eql(1);
      expect(utils.adapters.CustomDynamoDbPersistenceAdapter.args).to.eql([
        [
          {
            createTable: false,
            dynamoDBClient: services.dynamo,
            tableName: config.SESSIONS_DYNAMO_TABLE,
          },
        ],
      ]);

      expect(utils.handlers.ErrorHandlerGenerator.args[0]).to.eql([services.metrics]);
      expect(utils.interceptors.RequestInterceptorGenerator.args[0]).to.eql([services.metrics, services.adapter]);
    });

    it('builds local skill correctly', () => {
      const output = 'output';
      const create = sinon.stub().returns(output);
      const withPersistenceAdapter = sinon.stub().returns({ create });
      const addResponseInterceptors = sinon.stub().returns({ withPersistenceAdapter });
      const addRequestInterceptors = sinon.stub().returns({ addResponseInterceptors });
      const addErrorHandlers = sinon.stub().returns({ addRequestInterceptors });
      const withApiClient = sinon.stub().returns({ addErrorHandlers });
      const addRequestHandlers = sinon.stub().returns({ withApiClient });
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
          ErrorHandlerGenerator: sinon.stub().returns('ErrorHandler'),
        },
        interceptors: { ResponseInterceptor: 'ResponseInterceptor', RequestInterceptorGenerator: sinon.stub().returns('RequestInterceptor') },
        builder: { custom: sinon.stub().returns({ addRequestHandlers }) },
        adapters: {
          MemoryPersistenceAdapter: sinon.stub().returns({ foo: 'bar' }),
        },
        APIClient: sinon.stub().returns({ api: 'client' }),
      };
      const config = { SESSIONS_DYNAMO_TABLE: 'SESSIONS_DYNAMO_TABLE', SESSIONS_SOURCE: 'local' };

      const alexaManager = AlexaManager(services as any, config as any, utils as any);

      expect(alexaManager.skill).to.eql(output);
      expect(utils.builder.custom.callCount).to.eql(1);
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
        ],
      ]);
      expect(withApiClient.args).to.eql([[{ api: 'client' }]]);
      expect(addErrorHandlers.args).to.eql([[utils.handlers.ErrorHandlerGenerator()]]);
      expect(addRequestInterceptors.args).to.eql([[utils.interceptors.RequestInterceptorGenerator()]]);
      expect(addResponseInterceptors.args).to.eql([[utils.interceptors.ResponseInterceptor]]);
      expect(withPersistenceAdapter.args).to.eql([[{ foo: 'bar' }]]);
      expect(create.callCount).to.eql(1);
      expect(utils.adapters.MemoryPersistenceAdapter.args).to.eql([[]]);

      expect(utils.APIClient.args).to.eql([[]]);
      expect(utils.handlers.ErrorHandlerGenerator.args[0]).to.eql([services.metrics]);
      expect(utils.interceptors.RequestInterceptorGenerator.args[0]).to.eql([services.metrics, services.adapter]);
    });

    it('builds mongo skill correctly', () => {
      const output = 'output';
      const create = sinon.stub().returns(output);
      const withPersistenceAdapter = sinon.stub().returns({ create });
      const addResponseInterceptors = sinon.stub().returns({ withPersistenceAdapter });
      const addRequestInterceptors = sinon.stub().returns({ addResponseInterceptors });
      const addErrorHandlers = sinon.stub().returns({ addRequestInterceptors });
      const withApiClient = sinon.stub().returns({ addErrorHandlers });
      const addRequestHandlers = sinon.stub().returns({ withApiClient });
      const services = {
        dynamo: 'dynamo',
        metrics: 'metrics',
        adapter: 'adapter',
        mongo: 'mongo',
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
          ErrorHandlerGenerator: sinon.stub().returns('ErrorHandler'),
        },
        interceptors: { ResponseInterceptor: 'ResponseInterceptor', RequestInterceptorGenerator: sinon.stub().returns('RequestInterceptor') },
        builder: { custom: sinon.stub().returns({ addRequestHandlers }) },
        adapters: {
          MongoPersistenceAdapter: sinon.stub().returns({ foo: 'bar' }),
        },
        APIClient: sinon.stub().returns({ api: 'client' }),
      };
      const config = { SESSIONS_DYNAMO_TABLE: 'SESSIONS_DYNAMO_TABLE', SESSIONS_SOURCE: 'mongo' };

      const alexaManager = AlexaManager(services as any, config as any, utils as any);

      expect(alexaManager.skill).to.eql(output);
      expect(utils.builder.custom.callCount).to.eql(1);
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
        ],
      ]);
      expect(withApiClient.args).to.eql([[{ api: 'client' }]]);
      expect(addErrorHandlers.args).to.eql([[utils.handlers.ErrorHandlerGenerator()]]);
      expect(addRequestInterceptors.args).to.eql([[utils.interceptors.RequestInterceptorGenerator()]]);
      expect(addResponseInterceptors.args).to.eql([[utils.interceptors.ResponseInterceptor]]);
      expect(withPersistenceAdapter.args).to.eql([[{ foo: 'bar' }]]);
      expect(create.callCount).to.eql(1);
      expect(utils.adapters.MongoPersistenceAdapter.args).to.eql([[services.mongo]]);

      expect(utils.APIClient.args).to.eql([[]]);
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
