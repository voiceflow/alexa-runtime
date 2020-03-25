import { expect } from 'chai';
import sinon from 'sinon';

import { F, S } from '@/lib/constants';
import { initializeGenerator, VAR_VF } from '@/lib/services/alexa/handlers/lifecycle/initialize';
import { StreamAction } from '@/lib/services/voiceflow/handlers/stream';

describe('initialize lifecycle unit tests', async () => {
  let clock: sinon.SinonFakeTimers;

  beforeEach(() => {
    clock = sinon.useFakeTimers(Date.now()); // fake Date.now
  });
  afterEach(() => {
    clock.restore(); // restore Date.now
    sinon.restore();
  });

  describe('initialize', () => {
    const generateFakes = () => {
      const resumeFrame = { foo: 'bar' };
      const utils = {
        resume: {
          createResumeFrame: sinon.stub().returns(resumeFrame),
          RESUME_DIAGRAM_ID: 'resume-id',
        },
        client: {
          Store: {
            initialize: sinon.stub(),
          },
          Frame: sinon.stub().returns('frame'),
        },
      };

      const metaObj = {
        repeat: 2,
        global: ['a', 'b', 'c'],
        restart: true,
        diagram: 'diagram-id',
        resume_prompt: null,
        alexa_permissions: 'alexa-permission',
      };

      const topStorage = {
        set: sinon.stub(),
        delete: sinon.stub(),
        get: sinon.stub().returns(null),
      };

      const context = {
        fetchMetadata: sinon.stub().resolves(metaObj),
        stack: {
          isEmpty: sinon.stub().returns(false),
          flush: sinon.stub(),
          push: sinon.stub(),
          top: sinon.stub().returns({
            storage: topStorage,
          }),
          getFrames: sinon.stub(),
          popTo: sinon.stub(),
        },
        storage: {
          get: sinon.stub().returns(true),
          set: sinon.stub(),
          delete: sinon.stub(),
          produce: sinon.stub(),
        },
        variables: {
          get: sinon.stub(),
          merge: sinon.stub(),
        },
        trace: {
          speak: sinon.stub(),
        },
      };

      const input = {
        requestEnvelope: {
          request: {
            locale: 'en',
          },
          context: { System: { user: { userId: 'user-id' }, device: { supportedInterfaces: 'supported-interfaces' } } },
        },
      };

      return {
        resumeFrame,
        utils,
        metaObj,
        context,
        input,
        topStorage,
      };
    };

    it('first session', async () => {
      const { utils, metaObj, context, input } = generateFakes();

      const storageGet = sinon.stub();
      storageGet
        .withArgs(S.SESSIONS)
        .onFirstCall()
        .returns(null)
        .onSecondCall()
        .returns(1);
      const locale = 'en';
      storageGet.withArgs(S.LOCALE).returns(locale);
      const userId = 'user-id';
      storageGet.withArgs(S.USER).returns(userId);
      const lastSpeak = 'last speak';
      storageGet.withArgs(F.SPEAK).returns(lastSpeak);
      const permissions = 'permissions';
      storageGet.withArgs(S.ALEXA_PERMISSIONS).returns(permissions);
      const capabilities = 'permissions';
      storageGet.withArgs(S.SUPPORTED_INTERFACES).returns(capabilities);

      context.storage.get = storageGet;

      const initialize = initializeGenerator(utils as any);

      await initialize(context as any, input as any);

      expect(context.storage.get.args[0]).to.eql([S.SESSIONS]);
      expect(context.storage.set.args[0]).to.eql([S.SESSIONS, 1]);
      expect(context.storage.set.args[1]).to.eql([S.LOCALE, input.requestEnvelope.request.locale]);
      expect(context.storage.set.args[2]).to.eql([S.USER, userId]);
      expect(context.storage.set.args[3]).to.eql([S.SUPPORTED_INTERFACES, input.requestEnvelope.context.System.device?.supportedInterfaces]);
      expect(context.storage.set.args[4]).to.eql([S.ALEXA_PERMISSIONS, metaObj.alexa_permissions]);
      expect(context.storage.set.args[5]).to.eql([S.REPEAT, metaObj.repeat]);
      expect(context.variables.merge.args[0]).to.eql([
        {
          timestamp: Math.floor(clock.now / 1000),
          locale,
          user_id: userId,
          sessions: 1,
          platform: 'alexa',
          [VAR_VF]: {
            events: [],
            permissions,
            capabilities,
          },
          _system: input.requestEnvelope.context.System,
        },
      ]);
      expect(utils.client.Store.initialize.args[0]).to.eql([context.variables, metaObj.global, 0]);
    });

    it('second session', async () => {
      // existing session and userId
      const { utils, context, input } = generateFakes();

      const initialize = initializeGenerator(utils as any);

      await initialize(context as any, input as any);

      expect(context.storage.get.args[0]).to.eql([S.SESSIONS]);
      expect(context.storage.produce.callCount).to.eql(2);

      const fn = context.storage.produce.args[0][0];
      const draft = {
        [S.SESSIONS]: 1,
      };

      fn(draft);

      expect(draft[S.SESSIONS]).to.eql(2);

      const streamDraftCb = context.storage.produce.args[1][0];
      const streamDraft = { [S.STREAM_PLAY]: { action: null } };
      streamDraftCb(streamDraft);
      expect(streamDraft[S.STREAM_PLAY].action).to.eql(StreamAction.END);
    });

    it('meta repeat null, no alexa permissions, no system device', async () => {
      const { utils, context, input, metaObj } = generateFakes();

      metaObj.repeat = null as any;
      metaObj.alexa_permissions = null as any;
      context.fetchMetadata = sinon.stub().resolves(metaObj);

      const fn = initializeGenerator(utils as any);

      delete input.requestEnvelope.context.System.device;
      await fn(context as any, input as any);

      expect(context.storage.set.args[4]).to.eql([S.REPEAT, 100]);
      expect(context.storage.set.args[2]).to.eql([S.SUPPORTED_INTERFACES, undefined]);
    });

    describe('restart logic', () => {
      describe('shouldRestart', () => {
        it('stack empty', async () => {
          const { utils, context, input, metaObj } = generateFakes();

          context.stack.isEmpty = sinon.stub().returns(true);

          const fn = initializeGenerator(utils as any);

          await fn(context as any, input as any);

          expect(context.stack.flush.callCount).to.eql(1);
          expect(utils.client.Frame.args[0]).to.eql([{ diagramID: metaObj.diagram }]);
          expect(context.stack.push.callCount).to.eql(1);
        });

        it('meta restart', async () => {
          const { utils, context, input, metaObj } = generateFakes();

          context.stack.isEmpty = sinon.stub().returns(false);
          metaObj.restart = true;
          context.fetchMetadata = sinon.stub().resolves(metaObj);

          const fn = initializeGenerator(utils as any);

          await fn(context as any, input as any);

          expect(context.stack.flush.callCount).to.eql(1);
          expect(utils.client.Frame.args[0]).to.eql([{ diagramID: metaObj.diagram }]);
          expect(context.stack.push.callCount).to.eql(1);
        });

        it('resume var false', async () => {
          const { utils, context, input, metaObj } = generateFakes();

          context.stack.isEmpty = sinon.stub().returns(false);
          metaObj.restart = false;
          context.variables.get = sinon.stub().returns({ resume: false });

          context.fetchMetadata = sinon.stub().resolves(metaObj);

          const fn = initializeGenerator(utils as any);

          await fn(context as any, input as any);

          expect(context.stack.flush.callCount).to.eql(1);
          expect(utils.client.Frame.args[0]).to.eql([{ diagramID: metaObj.diagram }]);
          expect(context.stack.push.callCount).to.eql(1);
        });
      });

      describe('resume prompt', () => {
        it('resume stack 0', async () => {
          const { utils, context, input, metaObj, topStorage, resumeFrame } = generateFakes();

          context.stack.isEmpty = sinon.stub().returns(false);
          context.stack.getFrames = sinon.stub().returns([]);
          metaObj.restart = false;
          context.variables.get = sinon.stub().returns({ resume: true });
          metaObj.resume_prompt = { foo: 'bar' } as any;

          context.fetchMetadata = sinon.stub().resolves(metaObj);

          const fn = initializeGenerator(utils as any);

          await fn(context as any, input as any);

          expect(topStorage.set.args[0]).to.eql([F.CALLED_COMMAND, true]);
          expect(utils.resume.createResumeFrame.args[0]).to.eql([metaObj.resume_prompt]);
          expect(context.stack.push.args[0]).to.eql([resumeFrame]);
        });

        it('resume stack > 0', async () => {
          const { utils, context, input, metaObj, topStorage, resumeFrame } = generateFakes();

          context.stack.isEmpty = sinon.stub().returns(false);
          context.stack.getFrames = sinon
            .stub()
            .returns([
              { getDiagramID: () => false },
              { getDiagramID: () => false },
              { getDiagramID: () => utils.resume.RESUME_DIAGRAM_ID },
              { getDiagramID: () => false },
            ]);
          metaObj.restart = false;
          context.variables.get = sinon.stub().returns({ resume: true });
          metaObj.resume_prompt = { foo: 'bar' } as any;

          context.fetchMetadata = sinon.stub().resolves(metaObj);

          const fn = initializeGenerator(utils as any);

          await fn(context as any, input as any);

          expect(topStorage.set.args[0]).to.eql([F.CALLED_COMMAND, true]);
          expect(context.stack.popTo.args[0]).to.eql([2]);
          expect(utils.resume.createResumeFrame.args[0]).to.eql([metaObj.resume_prompt]);
          expect(context.stack.push.args[0]).to.eql([resumeFrame]);
        });
      });

      describe('else', () => {
        it('no last speak', async () => {
          const { utils, context, input, metaObj, topStorage } = generateFakes();

          metaObj.restart = false;
          context.fetchMetadata = sinon.stub().resolves(metaObj);
          topStorage.get = sinon.stub().returns(null);

          const fn = initializeGenerator(utils as any);

          await fn(context as any, input as any);

          expect(topStorage.delete.args[0]).to.eql([F.CALLED_COMMAND]);
          expect(topStorage.get.args[0]).to.eql([F.SPEAK]);
          expect(context.storage.set.args[5]).to.eql([S.OUTPUT, '']);
          expect(context.trace.speak.args).to.eql([['']]);
        });

        it('with last speak', async () => {
          const { utils, context, input, metaObj, topStorage } = generateFakes();

          metaObj.restart = false;
          context.fetchMetadata = sinon.stub().resolves(metaObj);
          const lastSpeak = 'random text';
          topStorage.get = sinon.stub().returns(lastSpeak);

          const fn = initializeGenerator(utils as any);

          await fn(context as any, input as any);

          expect(topStorage.delete.args[0]).to.eql([F.CALLED_COMMAND]);
          expect(topStorage.get.args[0]).to.eql([F.SPEAK]);
          expect(context.storage.set.args[5]).to.eql([S.OUTPUT, lastSpeak]);
          expect(context.trace.speak.args).to.eql([[lastSpeak]]);
        });
      });
    });
  });
});
