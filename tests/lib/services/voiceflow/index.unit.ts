import { EventType } from '@voiceflow/client';
import { expect } from 'chai';
import sinon from 'sinon';

import { F, S, TEST_VERSION_ID } from '@/lib/constants';
import VoiceflowManager from '@/lib/services/voiceflow';

describe('voiceflowManager unit tests', async () => {
  afterEach(() => sinon.restore());

  describe('client', () => {
    const generateFakes = () => {
      const clientObj = {
        setEvent: sinon.stub(),
      };
      const services = {
        utils: {
          resume: {
            ResumeDiagram: { foo: 'bar' },
            RESUME_DIAGRAM_ID: 'diagram-id',
          },
          Client: sinon.stub().returns(clientObj),
          executeEvents: sinon.stub(),
        },
        secretsProvider: {
          get: sinon.stub().returns('random-secret'),
        },
      };
      const config = {
        VF_DATA_ENDPOINT: 'random-endpoint',
      };

      return {
        clientObj,
        services,
        config,
      };
    };

    it('works correctly', async () => {
      const { clientObj, services, config } = generateFakes();

      const executeEventsOutput = { foo: 'bar' };
      services.utils.executeEvents = sinon.stub().returns(executeEventsOutput);

      const voiceflowManager = new VoiceflowManager(services as any, config as any);

      const client = voiceflowManager.client();

      expect(client).to.eql(clientObj);
      expect(clientObj.setEvent.callCount).to.eql(5);
      expect(clientObj.setEvent.args[0][0]).to.eql(EventType.traceWillAdd);
      expect(clientObj.setEvent.args[1][0]).to.eql(EventType.stackDidChange);
      expect(clientObj.setEvent.args[2][0]).to.eql(EventType.frameDidFinish);
      expect(clientObj.setEvent.args[3][0]).to.eql(EventType.diagramWillFetch);
      expect(clientObj.setEvent.args[4]).to.eql([EventType.stateDidExecute, executeEventsOutput]);
      expect(services.utils.executeEvents.args).to.eql([[EventType.stateDidExecute]]);
    });

    describe('traceWillAdd', () => {
      it('not test id', () => {
        const { clientObj, services, config } = generateFakes();

        const voiceflowManager = new VoiceflowManager(services as any, config as any);

        voiceflowManager.client();

        const fn = clientObj.setEvent.args[0][1];

        const context = { versionID: 'random-version-id' };
        const stop = sinon.stub();

        fn({ context, stop });

        expect(stop.callCount).to.eql(1);
      });

      it('test id', () => {
        const { clientObj, services, config } = generateFakes();

        const voiceflowManager = new VoiceflowManager(services as any, config as any);

        voiceflowManager.client();

        const fn = clientObj.setEvent.args[0][1];

        const context = { versionID: TEST_VERSION_ID };
        const stop = sinon.stub();

        fn({ context, stop });

        expect(stop.callCount).to.eql(0);
      });
    });

    describe('stackDidChange', () => {
      it('no top frame', () => {
        const { clientObj, services, config } = generateFakes();

        const voiceflowManager = new VoiceflowManager(services as any, config as any);

        voiceflowManager.client();

        const fn = clientObj.setEvent.args[1][1];

        const context = { trace: { flow: sinon.stub() }, stack: { top: sinon.stub().returns(null) } };

        fn({ context });

        expect(context.trace.flow.args).to.eql([[undefined]]);
      });

      it('with top frame', () => {
        const { clientObj, services, config } = generateFakes();

        const voiceflowManager = new VoiceflowManager(services as any, config as any);

        voiceflowManager.client();

        const fn = clientObj.setEvent.args[1][1];

        const diagramID = 'diagram-id';
        const context = { trace: { flow: sinon.stub() }, stack: { top: sinon.stub().returns({ getDiagramID: sinon.stub().returns(diagramID) }) } };

        fn({ context });

        expect(context.trace.flow.args).to.eql([[diagramID]]);
      });
    });

    describe('frameDidFinish', () => {
      it('no top frame', async () => {
        const { clientObj, services, config } = generateFakes();

        const voiceflowManager = new VoiceflowManager(services as any, config as any);

        voiceflowManager.client();

        const fn = clientObj.setEvent.args[2][1];

        const context = {
          stack: {
            top: sinon.stub().returns(null),
          },
        };

        fn({ context });

        expect(context.stack.top.callCount).to.eql(1);
      });

      it('called command false', async () => {
        const { clientObj, services, config } = generateFakes();

        const voiceflowManager = new VoiceflowManager(services as any, config as any);

        voiceflowManager.client();

        const fn = clientObj.setEvent.args[2][1];

        const storageTop = {
          get: sinon.stub().returns(false),
        };
        const context = {
          stack: {
            top: sinon.stub().returns({ storage: storageTop }),
          },
        };

        fn({ context });

        expect(storageTop.get.args[0]).to.eql([F.CALLED_COMMAND]);
      });

      it('called command true but no output', async () => {
        const { clientObj, services, config } = generateFakes();

        const voiceflowManager = new VoiceflowManager(services as any, config as any);

        voiceflowManager.client();

        const fn = clientObj.setEvent.args[2][1];

        const topStorageGet = sinon.stub();
        topStorageGet.withArgs(F.CALLED_COMMAND).returns(true);
        topStorageGet.withArgs(F.SPEAK).returns(null);

        const storageTop = {
          get: topStorageGet,
          delete: sinon.stub(),
        };
        const context = {
          stack: {
            top: sinon.stub().returns({ storage: storageTop }),
          },
        };

        fn({ context });

        expect(topStorageGet.args[0]).to.eql([F.CALLED_COMMAND]);
        expect(storageTop.delete.args[0]).to.eql([F.CALLED_COMMAND]);
        expect(topStorageGet.args[1]).to.eql([F.SPEAK]);
      });

      it('called command true with output', async () => {
        const { clientObj, services, config } = generateFakes();

        const voiceflowManager = new VoiceflowManager(services as any, config as any);

        voiceflowManager.client();

        const fn = clientObj.setEvent.args[2][1];

        const fSpeak = 'random output';
        const topStorageGet = sinon.stub();
        topStorageGet.withArgs(F.CALLED_COMMAND).returns(true);
        topStorageGet.withArgs(F.SPEAK).returns(fSpeak);

        const storageTop = {
          get: topStorageGet,
          delete: sinon.stub(),
        };
        const context = {
          trace: { speak: sinon.stub() },
          stack: {
            top: sinon.stub().returns({ storage: storageTop }),
          },
          storage: {
            produce: sinon.stub(),
          },
        };

        fn({ context });

        expect(topStorageGet.args[0]).to.eql([F.CALLED_COMMAND]);
        expect(storageTop.delete.args[0]).to.eql([F.CALLED_COMMAND]);
        expect(topStorageGet.args[1]).to.eql([F.SPEAK]);
        expect(context.trace.speak.args).to.eql([[fSpeak]]);

        const fn2 = context.storage.produce.args[0][0];

        const initialDraft = 'initial';
        const draft = {
          [S.OUTPUT]: initialDraft,
        };

        fn2(draft);

        expect(draft[S.OUTPUT]).to.eql(initialDraft + fSpeak);
      });
    });

    describe('diagramWillFetch', () => {
      it('diagramID is eql to RESUME_DIAGRAM_ID', async () => {
        const { clientObj, services, config } = generateFakes();

        services.utils.resume.RESUME_DIAGRAM_ID = 'different-id';

        const voiceflowManager = new VoiceflowManager(services as any, config as any);

        voiceflowManager.client();

        const fn = clientObj.setEvent.args[3][1];

        const diagramID = 'diagram-id';
        const override = sinon.stub();

        fn({ diagramID, override });

        expect(override.callCount).to.eql(0);
      });

      it('diagramID is not eql to RESUME_DIAGRAM_ID', async () => {
        const { clientObj, services, config } = generateFakes();

        services.utils.resume.RESUME_DIAGRAM_ID = 'diagram-id';

        const voiceflowManager = new VoiceflowManager(services as any, config as any);

        voiceflowManager.client();

        const fn = clientObj.setEvent.args[3][1];

        const diagramID = 'diagram-id';
        const override = sinon.stub();

        fn({ diagramID, override });

        expect(override.args[0]).to.eql([services.utils.resume.ResumeDiagram]);
      });
    });
  });
});
