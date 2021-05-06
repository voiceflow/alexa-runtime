import { expect } from 'chai';
import sinon from 'sinon';

import { S } from '@/lib/constants';
import { DOCUMENT_VIDEO_TYPE, RENDER_DOCUMENT_DIRECTIVE_TYPE } from '@/lib/services/runtime/handlers/display/constants';
import DisplayResponseBuilder, { CommandsResponseBuilder, DocumentResponseBuilder } from '@/lib/services/runtime/handlers/display/responseBuilder';
import { VideoCommand, VideoCommandType } from '@/lib/services/runtime/handlers/display/types';

describe('DisplayResponseBuilder unit tests', () => {
  describe('DisplayResponseBuilder', () => {
    it('works correctly', async () => {
      const runtime = { storage: { get: sinon.stub().returns(null) } };
      await DisplayResponseBuilder(runtime as any, null as any);
      expect(runtime.storage.get.args).to.eql([[S.DISPLAY_INFO], [S.DISPLAY_INFO]]);
    });
  });

  describe('CommandsResponseBuilder', () => {
    it('no displayInfo', async () => {
      const runtime = { storage: { get: sinon.stub().returns(null) } };
      expect(await CommandsResponseBuilder(runtime as any, null as any)).to.eql(undefined);
      expect(runtime.storage.get.args).to.eql([[S.DISPLAY_INFO]]);
    });

    it('no commands', async () => {
      const runtime = { storage: { get: sinon.stub().returns({}) } };
      expect(await CommandsResponseBuilder(runtime as any, null as any)).to.eql(undefined);
      expect(runtime.storage.get.args).to.eql([[S.DISPLAY_INFO]]);
    });

    it('no commands length', async () => {
      const runtime = { storage: { produce: sinon.stub(), get: sinon.stub().returns({ commands: [] }) } };
      expect(await CommandsResponseBuilder(runtime as any, null as any)).to.eql(undefined);
      expect(runtime.storage.get.args).to.eql([[S.DISPLAY_INFO]]);
      expect(runtime.storage.produce.callCount).to.eql(1);

      // assert produce callback
      const produceCallback = runtime.storage.produce.args[0][0];
      const state = { [S.DISPLAY_INFO]: { commands: ['foo', 'bar'] } };
      produceCallback(state);
      expect(state).to.eql({ [S.DISPLAY_INFO]: {} });
    });

    it('has commands', async () => {
      const commands = ['a', 'b'];
      const runtime = { versionID: 'version-id', storage: { produce: sinon.stub(), get: sinon.stub().returns({ commands }) } };
      const builder = { addDirective: sinon.stub() };
      expect(await CommandsResponseBuilder(runtime as any, builder as any)).to.eql(undefined);
      expect(builder.addDirective.args).to.eql([
        [
          {
            type: 'Alexa.Presentation.APL.ExecuteCommands',
            token: runtime.versionID,
            commands,
          },
        ],
      ]);
    });

    it('command updates playVideo', async () => {
      const clock = sinon.useFakeTimers(Date.now()); // fake Date.now
      const commands = [{ type: VideoCommandType.CONTROL_MEDIA, command: VideoCommand.PLAY, componentId: 'test' }];
      const runtime = { versionID: 'version-id', storage: { produce: sinon.stub(), get: sinon.stub().returns({ commands }) } };
      const builder = { addDirective: sinon.stub() };
      expect(await CommandsResponseBuilder(runtime as any, builder as any)).to.eql(undefined);

      const fn = runtime.storage.produce.args[0][0];
      const state = { displayInfo: { playingVideos: {} } };
      fn(state);
      expect(state).to.eql({
        displayInfo: {
          playingVideos: {
            test: { started: clock.now },
          },
        },
      });

      expect(builder.addDirective.args).to.eql([
        [
          {
            type: 'Alexa.Presentation.APL.ExecuteCommands',
            token: runtime.versionID,
            commands,
          },
        ],
      ]);
    });
  });

  describe('DocumentResponseBuilder', () => {
    it('no displayInfo', async () => {
      const runtime = { storage: { get: sinon.stub().returns(null) } };
      expect(await DocumentResponseBuilder(runtime as any, null as any)).to.eql(undefined);
      expect(runtime.storage.get.args).to.eql([[S.DISPLAY_INFO]]);
    });

    it('shouldUpdate false', async () => {
      const runtime = { storage: { get: sinon.stub().returns({ shouldUpdate: false }) } };
      expect(await DocumentResponseBuilder(runtime as any, null as any)).to.eql(undefined);
      expect(runtime.storage.get.args).to.eql([[S.DISPLAY_INFO]]);
    });

    it('currentDisplay undefined', async () => {
      const runtime = { storage: { get: sinon.stub().returns({ shouldUpdate: true }) } };
      expect(await DocumentResponseBuilder(runtime as any, null as any)).to.eql(undefined);
      expect(runtime.storage.get.args).to.eql([[S.DISPLAY_INFO]]);
    });

    it('no document', async () => {
      const runtime = {
        storage: { get: sinon.stub().returns({ shouldUpdate: true, currentDisplay: 'current-display' }) },
        variables: { getState: sinon.stub().returns(null) },
        services: {
          multimodal: { getDisplayDocument: sinon.stub().resolves(null) },
        },
      };
      expect(await DocumentResponseBuilder(runtime as any, null as any)).to.eql(undefined);
      expect(runtime.storage.get.args).to.eql([[S.DISPLAY_INFO]]);
    });

    it('no document.document or datasource', async () => {
      const document = { document: 'document', dataSources: null };
      const runtime = {
        storage: { get: sinon.stub().returns({ shouldUpdate: true, currentDisplay: 'current-display', dataSource: '{var1}' }) },
        variables: { getState: sinon.stub().returns({ var1: '{"invalid"}' }) },
        services: {
          multimodal: { getDisplayDocument: sinon.stub().returns(document) },
        },
      };
      expect(await DocumentResponseBuilder(runtime as any, null as any)).to.eql(undefined);
      expect(runtime.storage.get.args).to.eql([[S.DISPLAY_INFO]]);
    });

    it('works correctly', async () => {
      const document = {
        dataSources: {},
        a: { b: { type: DOCUMENT_VIDEO_TYPE } },
        c: { type: DOCUMENT_VIDEO_TYPE, id: 'c', onEnd: 'on-end', onPlay: 'on-play' },
      };
      const rawVariables = { foo: 'bar' };
      const runtime = {
        versionID: 'version-id',
        storage: {
          produce: sinon.stub(),
          get: sinon.stub().returns({ shouldUpdate: true, currentDisplay: 'current-display' }),
        },
        variables: { getState: sinon.stub().returns(rawVariables) },
        services: {
          multimodal: { getDisplayDocument: sinon.stub().returns(document) },
        },
      };
      const builder = { addDirective: sinon.stub(), withShouldEndSession: sinon.stub() };
      expect(await DocumentResponseBuilder(runtime as any, builder as any)).to.eql(undefined);
      expect(runtime.storage.get.args).to.eql([[S.DISPLAY_INFO]]);
      expect(builder.withShouldEndSession.args).to.eql([[undefined]]);
      expect(builder.addDirective.args).to.eql([
        [
          {
            type: RENDER_DOCUMENT_DIRECTIVE_TYPE,
            token: runtime.versionID,
            document,
            datasources: document.dataSources,
          },
        ],
      ]);
      expect(runtime.storage.produce.callCount).to.eql(1);

      // assert produce callback
      const produceCallback = runtime.storage.produce.args[0][0];
      const state = { [S.DISPLAY_INFO]: { lastVariables: null, shouldUpdate: true, shouldUpdateOnResume: true } };
      produceCallback(state);
      expect(state).to.eql({ [S.DISPLAY_INFO]: { lastVariables: rawVariables } });
    });
  });
});
