import { expect } from 'chai';

import { DOCUMENT_VIDEO_TYPE, EVENT_SEND_EVENT } from '@/lib/services/runtime/handlers/display/constants';
import {
  deepFind,
  deepFindVideos,
  getEventToSend,
  shouldRebuildDisplay,
} from '@/lib/services/runtime/handlers/display/utils';

describe('display handler utils unit tests', () => {
  describe('getEventToSend', () => {
    it('works correctly', () => {
      const argument = 'random argument';
      expect(getEventToSend(argument)).to.eql({ type: EVENT_SEND_EVENT, arguments: [argument] });
    });
  });

  describe('shouldRebuildDisplay', () => {
    it('works correctly', () => {
      expect(shouldRebuildDisplay(['a', 'b'], { a: 1, b: 2 }, { a: 1, b: 0 })).to.eql(true);
      expect(shouldRebuildDisplay(['a', 'b'], { a: 1, b: 2, c: 3 }, { a: 1, b: 2, d: 4 })).to.eql(false);
      expect(shouldRebuildDisplay(undefined as any, {}, undefined as any)).to.eql(false);
    });
  });

  describe('deepFind', () => {
    it('collection not object', () => {
      expect(deepFind([], {})).to.eql([]);
    });

    it('no matches', () => {
      expect(deepFind({}, { foo: 'bar' })).to.eql([]);
    });

    it('works correctly', () => {
      const collection = {
        a: {},
        b: { foo: 'bar', nr: 1 },
        c: {},
        d: { one: { foo: 'bar', nr: 2 } },
        e: { two: { three: { foo: 'bar', nr: 3 } } },
      };
      expect(deepFind(collection, { foo: 'bar' })).to.eql([
        {
          item: collection.b,
          path: [],
        },
        {
          item: collection.d.one,
          path: ['d'],
        },
        {
          item: collection.e.two.three,
          path: ['e', 'two'],
        },
      ]);
    });
  });

  describe('deepFindVideos', () => {
    it('works correctly', () => {
      const collection = {
        1: {
          id: '1',
          onEnd: { type: 'not video' },
          onPlay: { type: 'not video' },
        },
        2: {
          id: '2',
          onEnd: { type: DOCUMENT_VIDEO_TYPE },
          onPlay: { type: 'random' },
        },
      };
      expect(deepFindVideos(collection).length).to.eql(1);
      expect(deepFindVideos([]).length).to.eql(0);
    });
  });
});
