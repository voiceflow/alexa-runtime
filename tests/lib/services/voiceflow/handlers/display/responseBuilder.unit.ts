import { expect } from 'chai';
import sinon from 'sinon';

import { S } from '@/lib/constants';
import { DOCUMENT_VIDEO_TYPE, RENDER_DOCUMENT_DIRECTIVE_TYPE } from '@/lib/services/voiceflow/handlers/display/constants';
import DisplayResponseBuilder, { CommandsResponseBuilder, DocumentResponseBuilder } from '@/lib/services/voiceflow/handlers/display/responseBuilder';
import { VideoCommand, VideoCommandType } from '@/lib/services/voiceflow/handlers/display/types';

describe('DisplayResponseBuilder unit tests', () => {
  describe('DisplayResponseBuilder', () => {
    it('works correctly', async () => {
      const context = { storage: { get: sinon.stub().returns(null) } };
      await DisplayResponseBuilder(context as any, null as any);
      expect(context.storage.get.args).to.eql([[S.DISPLAY_INFO], [S.DISPLAY_INFO]]);
    });
  });

  describe('CommandsResponseBuilder', () => {
    it('no displayInfo', async () => {
      const context = { storage: { get: sinon.stub().returns(null) } };
      expect(await CommandsResponseBuilder(context as any, null as any)).to.eql(undefined);
      expect(context.storage.get.args).to.eql([[S.DISPLAY_INFO]]);
    });

    it('no commands', async () => {
      const context = { storage: { get: sinon.stub().returns({}) } };
      expect(await CommandsResponseBuilder(context as any, null as any)).to.eql(undefined);
      expect(context.storage.get.args).to.eql([[S.DISPLAY_INFO]]);
    });

    it('no commands length', async () => {
      const context = { storage: { produce: sinon.stub(), get: sinon.stub().returns({ commands: [] }) } };
      expect(await CommandsResponseBuilder(context as any, null as any)).to.eql(undefined);
      expect(context.storage.get.args).to.eql([[S.DISPLAY_INFO]]);
      expect(context.storage.produce.callCount).to.eql(1);

      // assert produce callback
      const produceCallback = context.storage.produce.args[0][0];
      const state = { [S.DISPLAY_INFO]: { commands: ['foo', 'bar'] } };
      produceCallback(state);
      expect(state).to.eql({ [S.DISPLAY_INFO]: {} });
    });

    it('has commands', async () => {
      const commands = ['a', 'b'];
      const context = { versionID: 'version-id', storage: { produce: sinon.stub(), get: sinon.stub().returns({ commands }) } };
      const builder = { addDirective: sinon.stub() };
      expect(await CommandsResponseBuilder(context as any, builder as any)).to.eql(undefined);
      expect(builder.addDirective.args).to.eql([
        [
          {
            type: 'Alexa.Presentation.APL.ExecuteCommands',
            token: context.versionID,
            commands,
          },
        ],
      ]);
    });

    it('command updates playVideo', async () => {
      const clock = sinon.useFakeTimers(Date.now()); // fake Date.now
      const commands = [{ type: VideoCommandType.CONTROL_MEDIA, command: VideoCommand.PLAY, componentId: 'test' }];
      const context = { versionID: 'version-id', storage: { produce: sinon.stub(), get: sinon.stub().returns({ commands }) } };
      const builder = { addDirective: sinon.stub() };
      expect(await CommandsResponseBuilder(context as any, builder as any)).to.eql(undefined);

      const fn = context.storage.produce.args[0][0];
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
            token: context.versionID,
            commands,
          },
        ],
      ]);
    });
  });

  describe('DocumentResponseBuilder', () => {
    it('no displayInfo', async () => {
      const context = { storage: { get: sinon.stub().returns(null) } };
      expect(await DocumentResponseBuilder(context as any, null as any)).to.eql(undefined);
      expect(context.storage.get.args).to.eql([[S.DISPLAY_INFO]]);
    });

    it('shouldUpdate false', async () => {
      const context = { storage: { get: sinon.stub().returns({ shouldUpdate: false }) } };
      expect(await DocumentResponseBuilder(context as any, null as any)).to.eql(undefined);
      expect(context.storage.get.args).to.eql([[S.DISPLAY_INFO]]);
    });

    it('currentDisplay undefined', async () => {
      const context = { storage: { get: sinon.stub().returns({ shouldUpdate: true }) } };
      expect(await DocumentResponseBuilder(context as any, null as any)).to.eql(undefined);
      expect(context.storage.get.args).to.eql([[S.DISPLAY_INFO]]);
    });

    it('no document', async () => {
      const context = {
        storage: { get: sinon.stub().returns({ shouldUpdate: true, currentDisplay: 'current-display' }) },
        variables: { getState: sinon.stub().returns(null) },
        services: {
          multimodal: { getDisplayDocument: sinon.stub().resolves(null) },
        },
      };
      expect(await DocumentResponseBuilder(context as any, null as any)).to.eql(undefined);
      expect(context.storage.get.args).to.eql([[S.DISPLAY_INFO]]);
    });

    it('no document.document or datasource', async () => {
      const document = { document: 'document', dataSources: null };
      const context = {
        storage: { get: sinon.stub().returns({ shouldUpdate: true, currentDisplay: 'current-display', dataSource: '{var1}' }) },
        variables: { getState: sinon.stub().returns({ var1: '{"invalid"}' }) },
        services: {
          multimodal: { getDisplayDocument: sinon.stub().returns(document) },
        },
      };
      expect(await DocumentResponseBuilder(context as any, null as any)).to.eql(undefined);
      expect(context.storage.get.args).to.eql([[S.DISPLAY_INFO]]);
    });

    it('works correctly', async () => {
      const document = {
        dataSources: {},
        a: { b: { type: DOCUMENT_VIDEO_TYPE } },
        c: { type: DOCUMENT_VIDEO_TYPE, id: 'c', onEnd: 'on-end', onPlay: 'on-play' },
      };
      const rawVariables = { foo: 'bar' };
      const context = {
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
      const builder = { addDirective: sinon.stub() };
      expect(await DocumentResponseBuilder(context as any, builder as any)).to.eql(undefined);
      expect(context.storage.get.args).to.eql([[S.DISPLAY_INFO]]);
      expect(builder.addDirective.args).to.eql([
        [
          {
            type: RENDER_DOCUMENT_DIRECTIVE_TYPE,
            token: context.versionID,
            document,
            datasources: document.dataSources,
          },
        ],
      ]);
      expect(context.storage.produce.callCount).to.eql(1);

      // assert produce callback
      const produceCallback = context.storage.produce.args[0][0];
      const state = { [S.DISPLAY_INFO]: { lastVariables: null, shouldUpdate: true, shouldUpdateOnResume: true } };
      produceCallback(state);
      expect(state).to.eql({ [S.DISPLAY_INFO]: { lastVariables: rawVariables } });
    });
  });
});
