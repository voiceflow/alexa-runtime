import { EventCallback, EventType } from '@voiceflow/runtime';

import { S } from '@/lib/constants';

import { DisplayInfo } from './types';
import { shouldRebuildDisplay } from './utils';

// eslint-disable-next-line import/prefer-default-export
export const stateDidExecute: EventCallback<EventType.stateDidExecute> = ({ context, variables }) => {
  const displayInfo = context.storage.get(S.DISPLAY_INFO) as DisplayInfo | undefined;

  if (displayInfo && shouldRebuildDisplay(displayInfo.dataSourceVariables, variables.getState(), displayInfo.lastVariables)) {
    context.storage.produce((state) => {
      const dInfo = state[S.DISPLAY_INFO] as DisplayInfo;

      dInfo.shouldUpdate = true;
    });
  }
};
