import { EventCallback, EventType } from '@voiceflow/runtime';

import { S } from '@/lib/constants';

import { DisplayInfo } from './types';
import { shouldRebuildDisplay } from './utils';

// eslint-disable-next-line import/prefer-default-export
export const stateDidExecute: EventCallback<EventType.stateDidExecute> = ({ runtime, variables }) => {
  const displayInfo = runtime.storage.get<DisplayInfo | undefined>(S.DISPLAY_INFO);

  if (displayInfo && shouldRebuildDisplay(displayInfo.dataSourceVariables, variables.getState(), displayInfo.lastVariables)) {
    runtime.storage.produce<{ [S.DISPLAY_INFO]: DisplayInfo }>((state) => {
      const dInfo = state[S.DISPLAY_INFO];

      dInfo.shouldUpdate = true;
    });
  }
};
