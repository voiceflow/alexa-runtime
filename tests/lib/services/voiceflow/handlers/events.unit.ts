import { EventType } from '@voiceflow/general-runtime/build/runtime';
import { expect } from 'chai';
import sinon from 'sinon';

import { S } from '@/lib/constants';
import { executeEvents } from '@/lib/services/runtime/handlers/events';

describe('executeEvents', () => {
  it('event type in map', async () => {
    const fn = executeEvents(EventType.stateDidExecute);

    const runtime = { storage: { get: sinon.stub().returns(null) } };
    await fn({ runtime } as any);
    expect(runtime.storage.get.args).to.eql([[S.DISPLAY_INFO]]);
  });

  it('event type not in map', async () => {
    const fn = executeEvents('random' as any);
    await fn(null as any);
  });
});
