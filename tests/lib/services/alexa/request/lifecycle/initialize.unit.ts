import { RepeatType, SessionType, TraceType } from '@voiceflow/general-types';
import { expect } from 'chai';
import sinon from 'sinon';

import { F, S, T } from '@/lib/constants';
import { initializeGenerator, VAR_VF } from '@/lib/services/alexa/request/lifecycle/initialize';
import { StreamAction } from '@/lib/services/voiceflow/handlers/stream';

const VERSION_ID = 'version-id';

describe('initialize lifecycle unit tests', async () => {
  describe('initialize', () => {
    const generateFakes = () => {
      const resumeFrame = { foo: 'bar' };
      const utils = {
        resume: {
          createResumeFrame: sinon.stub().returns(resumeFrame),
          RESUME_PROGRAM_ID: 'resume-id',
        },
        client: {
          Store: {
            initialize: sinon.stub(),
          },
          Frame: sinon.stub().returns('frame'),
        },
      };

      const session: any = { type: SessionType.RESTART };
      const metaObj = {
        variables: ['a', 'b', 'c'],
        platformData: {
          slots: [
            { name: 'd', type: 'x' },
            { name: 'e', type: 'y' },
          ],
          settings: {
            permissions: ['alexa-permission'],
            repeat: RepeatType.DIALOG,
            session,
          },
        },
        rootDiagramID: 'diagram-id',
      };

      const topStorage = {
        set: sinon.stub(),
        delete: sinon.stub(),
        get: sinon.stub().returns(null),
      };

      const context = {
        getVersionID: sinon.stub().returns(VERSION_ID),
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
        turn: {
          set: sinon.stub(),
        },
        variables: {
          get: sinon.stub(),
          merge: sinon.stub(),
        },
        trace: {
          addTrace: sinon.stub(),
        },
        api: {
          getVersion: sinon.stub().resolves(metaObj),
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
      expect(context.storage.set.args[4]).to.eql([S.ALEXA_PERMISSIONS, metaObj.platformData.settings.permissions]);
      expect(context.storage.set.args[5]).to.eql([S.REPEAT, metaObj.platformData.settings.repeat]);
      expect(context.variables.merge.args[0]).to.eql([
        {
          timestamp: 0,
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
      expect(utils.client.Store.initialize.args[0]).to.eql([context.variables, metaObj.variables, 0]);
      expect(context.api.getVersion.args).to.eql([[VERSION_ID]]);
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
      expect(context.api.getVersion.args).to.eql([[VERSION_ID]]);
    });

    it('meta repeat null, no alexa permissions, no system device', async () => {
      const { utils, context, input, metaObj } = generateFakes();

      metaObj.platformData.settings.repeat = null as any;
      metaObj.platformData.settings.permissions = null as any;

      const fn = initializeGenerator(utils as any);

      delete input.requestEnvelope.context.System.device;
      await fn(context as any, input as any);

      expect(context.storage.set.args[4]).to.eql([S.REPEAT, RepeatType.ALL]);
      expect(context.storage.set.args[2]).to.eql([S.SUPPORTED_INTERFACES, undefined]);
      expect(context.api.getVersion.args).to.eql([[VERSION_ID]]);
    });

    describe('restart logic', () => {
      describe('shouldRestart', () => {
        it('stack empty', async () => {
          const { utils, context, input, metaObj } = generateFakes();

          context.stack.isEmpty = sinon.stub().returns(true);

          const fn = initializeGenerator(utils as any);

          await fn(context as any, input as any);

          expect(context.stack.flush.callCount).to.eql(1);
          expect(utils.client.Frame.args[0]).to.eql([{ programID: metaObj.rootDiagramID }]);
          expect(context.stack.push.callCount).to.eql(1);
          expect(context.turn.set.args[0]).to.eql([T.NEW_STACK, true]);
          expect(context.api.getVersion.args).to.eql([[VERSION_ID]]);
        });

        it('meta restart', async () => {
          const { utils, context, input, metaObj } = generateFakes();

          context.stack.isEmpty = sinon.stub().returns(false);
          metaObj.platformData.settings.session = { type: SessionType.RESTART };

          const fn = initializeGenerator(utils as any);

          await fn(context as any, input as any);

          expect(context.stack.flush.callCount).to.eql(1);
          expect(utils.client.Frame.args[0]).to.eql([{ programID: metaObj.rootDiagramID }]);
          expect(context.stack.push.callCount).to.eql(1);
          expect(context.api.getVersion.args).to.eql([[VERSION_ID]]);
        });

        it('resume var false', async () => {
          const { utils, context, input, metaObj } = generateFakes();

          context.stack.isEmpty = sinon.stub().returns(false);
          metaObj.platformData.settings.session = { type: SessionType.RESUME };
          context.variables.get = sinon.stub().returns({ resume: false });

          const fn = initializeGenerator(utils as any);

          await fn(context as any, input as any);

          expect(context.stack.flush.callCount).to.eql(1);
          expect(utils.client.Frame.args[0]).to.eql([{ programID: metaObj.rootDiagramID }]);
          expect(context.stack.push.callCount).to.eql(1);
          expect(context.api.getVersion.args).to.eql([[VERSION_ID]]);
        });
      });

      describe('resume prompt', () => {
        it('resume stack 0', async () => {
          const { utils, context, input, metaObj, topStorage, resumeFrame } = generateFakes();

          context.stack.isEmpty = sinon.stub().returns(false);
          context.stack.getFrames = sinon.stub().returns([]);
          const session = { type: SessionType.RESUME, resume: { foo: 'bar' }, follow: 'test' };
          metaObj.platformData.settings.session = session;
          context.variables.get = sinon.stub().returns({ resume: true });

          const fn = initializeGenerator(utils as any);

          await fn(context as any, input as any);

          expect(topStorage.set.args[0]).to.eql([F.CALLED_COMMAND, true]);
          expect(utils.resume.createResumeFrame.args[0]).to.eql([session.resume, session.follow]);
          expect(context.stack.push.args[0]).to.eql([resumeFrame]);
          expect(context.api.getVersion.args).to.eql([[VERSION_ID]]);
        });

        it('resume stack > 0', async () => {
          const { utils, context, input, metaObj, topStorage, resumeFrame } = generateFakes();

          context.stack.isEmpty = sinon.stub().returns(false);
          context.stack.getFrames = sinon
            .stub()
            .returns([
              { getProgramID: () => false },
              { getProgramID: () => false },
              { getProgramID: () => utils.resume.RESUME_PROGRAM_ID },
              { getProgramID: () => false },
            ]);
          const session = { type: SessionType.RESUME, resume: { foo: 'bar' }, follow: null };
          metaObj.platformData.settings.session = session;
          context.variables.get = sinon.stub().returns({ resume: true });

          const fn = initializeGenerator(utils as any);

          await fn(context as any, input as any);

          expect(topStorage.set.args[0]).to.eql([F.CALLED_COMMAND, true]);
          expect(context.stack.popTo.args[0]).to.eql([2]);
          expect(utils.resume.createResumeFrame.args[0]).to.eql([session.resume, session.follow]);
          expect(context.stack.push.args[0]).to.eql([resumeFrame]);
          expect(context.api.getVersion.args).to.eql([[VERSION_ID]]);
        });
      });

      describe('else', () => {
        it('no last speak', async () => {
          const { utils, context, input, metaObj, topStorage } = generateFakes();

          metaObj.platformData.settings.session = { type: SessionType.RESUME };
          topStorage.get = sinon.stub().returns(null);

          const fn = initializeGenerator(utils as any);

          await fn(context as any, input as any);

          expect(topStorage.delete.args[0]).to.eql([F.CALLED_COMMAND]);
          expect(topStorage.get.args[0]).to.eql([F.SPEAK]);
          expect(context.storage.set.args[5]).to.eql([S.OUTPUT, '']);
          expect(context.trace.addTrace.args).to.eql([[{ type: TraceType.SPEAK, payload: { message: '' } }]]);
          expect(context.api.getVersion.args).to.eql([[VERSION_ID]]);
        });

        it('with last speak', async () => {
          const { utils, context, input, metaObj, topStorage } = generateFakes();

          metaObj.platformData.settings.session = { type: SessionType.RESUME };
          const lastSpeak = 'random text';
          topStorage.get = sinon.stub().returns(lastSpeak);

          const fn = initializeGenerator(utils as any);

          await fn(context as any, input as any);

          expect(topStorage.delete.args[0]).to.eql([F.CALLED_COMMAND]);
          expect(topStorage.get.args[0]).to.eql([F.SPEAK]);
          expect(context.storage.set.args[5]).to.eql([S.OUTPUT, lastSpeak]);
          expect(context.trace.addTrace.args).to.eql([[{ type: TraceType.SPEAK, payload: { message: lastSpeak } }]]);
          expect(context.api.getVersion.args).to.eql([[VERSION_ID]]);
        });
      });
    });
  });
});
