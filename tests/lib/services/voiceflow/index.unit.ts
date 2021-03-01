import { TraceType } from '@voiceflow/general-types';
import { EventType } from '@voiceflow/runtime';
import { expect } from 'chai';
import sinon from 'sinon';

import { F, S } from '@/lib/constants';
import VoiceflowManager from '@/lib/services/runtime';

describe('voiceflowManager unit tests', async () => {
  afterEach(() => sinon.restore());

  describe('client', () => {
    const generateFakes = () => {
      const clientObj = {
        setEvent: sinon.stub(),
      };
      const services = {};
      const config = {
        VF_DATA_ENDPOINT: 'random-endpoint',
        VF_DATA_SECRET: 'random-secret',
        DATADOG_API_KEY: 'random-secret',
      };
      const utils = {
        resume: {
          ResumeDiagram: { foo: 'bar' },
          RESUME_PROGRAM_ID: 'diagram-id',
        },
        Client: sinon.stub().returns(clientObj),
        executeEvents: sinon.stub(),
        Handlers: () => [],
      };

      return {
        services,
        config,
        utils,
        clientObj,
      };
    };

    it('works correctly', async () => {
      const { clientObj, services, config, utils } = generateFakes();

      const executeEventsOutput = { foo: 'bar' };
      utils.executeEvents = sinon.stub().returns(executeEventsOutput);

      const client = VoiceflowManager(services as any, config as any, utils as any);

      expect(client).to.eql(clientObj);
      expect(clientObj.setEvent.callCount).to.eql(5);
      expect(clientObj.setEvent.args[0][0]).to.eql(EventType.traceWillAdd);
      expect(clientObj.setEvent.args[1][0]).to.eql(EventType.stackDidChange);
      expect(clientObj.setEvent.args[2][0]).to.eql(EventType.frameDidFinish);
      expect(clientObj.setEvent.args[3][0]).to.eql(EventType.programWillFetch);
      expect(clientObj.setEvent.args[4]).to.eql([EventType.stateDidExecute, executeEventsOutput]);
      expect(utils.executeEvents.args).to.eql([[EventType.stateDidExecute]]);
    });

    describe('traceWillAdd', () => {
      it('works', () => {
        const { clientObj, services, config, utils } = generateFakes();

        VoiceflowManager(services as any, config as any, utils as any);

        const fn = clientObj.setEvent.args[0][1];

        const runtime = { versionID: 'random-version-id' };
        const stop = sinon.stub();

        fn({ runtime, stop });

        expect(stop.callCount).to.eql(1);
      });
    });

    describe('stackDidChange', () => {
      it('no top frame', () => {
        const { clientObj, services, config, utils } = generateFakes();

        VoiceflowManager(services as any, config as any, utils as any);

        const fn = clientObj.setEvent.args[1][1];

        const runtime = { trace: { addTrace: sinon.stub() }, stack: { top: sinon.stub().returns(null) } };

        fn({ runtime });

        expect(runtime.trace.addTrace.args).to.eql([[{ type: 'flow', payload: { diagramID: undefined } }]]);
      });

      it('with top frame', () => {
        const { clientObj, services, config, utils } = generateFakes();

        VoiceflowManager(services as any, config as any, utils as any);

        const fn = clientObj.setEvent.args[1][1];

        const programID = 'diagram-id';
        const runtime = {
          trace: { addTrace: sinon.stub() },
          stack: { top: sinon.stub().returns({ getProgramID: sinon.stub().returns(programID) }) },
        };

        fn({ runtime });

        expect(runtime.trace.addTrace.args).to.eql([[{ type: 'flow', payload: { diagramID: programID } }]]);
      });
    });

    describe('frameDidFinish', () => {
      it('no top frame', async () => {
        const { clientObj, services, config, utils } = generateFakes();

        VoiceflowManager(services as any, config as any, utils as any);

        const fn = clientObj.setEvent.args[2][1];
        const runtime = {
          stack: {
            top: sinon.stub().returns(null),
          },
        };

        fn({ runtime });

        expect(runtime.stack.top.callCount).to.eql(1);
      });

      it('called command false', async () => {
        const { clientObj, services, config, utils } = generateFakes();

        VoiceflowManager(services as any, config as any, utils as any);

        const fn = clientObj.setEvent.args[2][1];

        const storageTop = {
          get: sinon.stub().returns(false),
        };
        const runtime = {
          stack: {
            top: sinon.stub().returns({ storage: storageTop }),
          },
        };

        fn({ runtime });

        expect(storageTop.get.args[0]).to.eql([F.CALLED_COMMAND]);
      });

      it('called command true but no output', async () => {
        const { clientObj, services, config, utils } = generateFakes();

        VoiceflowManager(services as any, config as any, utils as any);

        const fn = clientObj.setEvent.args[2][1];

        const topStorageGet = sinon.stub();
        topStorageGet.withArgs(F.CALLED_COMMAND).returns(true);
        topStorageGet.withArgs(F.SPEAK).returns(null);

        const storageTop = {
          get: topStorageGet,
          delete: sinon.stub(),
        };
        const runtime = {
          stack: {
            top: sinon.stub().returns({ storage: storageTop }),
          },
        };

        fn({ runtime });

        expect(topStorageGet.args[0]).to.eql([F.CALLED_COMMAND]);
        expect(storageTop.delete.args[0]).to.eql([F.CALLED_COMMAND]);
        expect(topStorageGet.args[1]).to.eql([F.SPEAK]);
      });

      it('called command true with output', async () => {
        const { clientObj, services, config, utils } = generateFakes();

        VoiceflowManager(services as any, config as any, utils as any);

        const fn = clientObj.setEvent.args[2][1];

        const fSpeak = 'random output';
        const topStorageGet = sinon.stub();
        topStorageGet.withArgs(F.CALLED_COMMAND).returns(true);
        topStorageGet.withArgs(F.SPEAK).returns(fSpeak);

        const storageTop = {
          get: topStorageGet,
          delete: sinon.stub(),
        };
        const runtime = {
          trace: { addTrace: sinon.stub() },
          stack: {
            top: sinon.stub().returns({ storage: storageTop }),
          },
          storage: {
            produce: sinon.stub(),
          },
        };

        fn({ runtime });

        expect(topStorageGet.args[0]).to.eql([F.CALLED_COMMAND]);
        expect(storageTop.delete.args[0]).to.eql([F.CALLED_COMMAND]);
        expect(topStorageGet.args[1]).to.eql([F.SPEAK]);
        expect(runtime.trace.addTrace.args).to.eql([[{ type: TraceType.SPEAK, payload: { message: fSpeak, type: 'message' } }]]);

        const fn2 = runtime.storage.produce.args[0][0];

        const initialDraft = 'initial';
        const draft = {
          [S.OUTPUT]: initialDraft,
        };

        fn2(draft);

        expect(draft[S.OUTPUT]).to.eql(initialDraft + fSpeak);
      });
    });

    describe('programWillFetch', () => {
      it('programID is eql to RESUME_PROGRAM_ID', async () => {
        const { clientObj, services, config, utils } = generateFakes();

        utils.resume.RESUME_PROGRAM_ID = 'different-id';

        VoiceflowManager(services as any, config as any, utils as any);

        const fn = clientObj.setEvent.args[3][1];

        const programID = 'diagram-id';
        const override = sinon.stub();

        fn({ programID, override });

        expect(override.callCount).to.eql(0);
      });

      it('programID is not eql to RESUME_PROGRAM_ID', async () => {
        const { clientObj, services, config, utils } = generateFakes();

        utils.resume.RESUME_PROGRAM_ID = 'diagram-id';

        VoiceflowManager(services as any, config as any, utils as any);

        const fn = clientObj.setEvent.args[3][1];

        const programID = 'diagram-id';
        const override = sinon.stub();

        fn({ programID, override });

        expect(override.args[0]).to.eql([utils.resume.ResumeDiagram]);
      });
    });
  });
});
