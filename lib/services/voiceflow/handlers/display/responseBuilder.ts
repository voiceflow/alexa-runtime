import { replaceVariables } from '@voiceflow/runtime';
import randomstring from 'randomstring';

import { S } from '@/lib/constants';
import { FullServiceMap } from '@/lib/services';
import { ResponseBuilder } from '@/lib/services/voiceflow/types';

import { ENDED_EVENT_PREFIX, RENDER_DOCUMENT_DIRECTIVE_TYPE, STARTED_EVENT_PREFIX, VIDEO_ID_PREFIX } from './constants';
import { DisplayInfo, VideoCommand, VideoCommandType } from './types';
import { deepFindVideos, getEventToSend } from './utils';

export const DocumentResponseBuilder: ResponseBuilder = async (context, builder) => {
  const displayInfo = context.storage.get(S.DISPLAY_INFO) as DisplayInfo | undefined;

  if (!displayInfo?.shouldUpdate || (displayInfo.currentDisplay === undefined && !displayInfo.document)) {
    return;
  }

  const variables = context.variables.getState();
  const services = context.services as FullServiceMap;

  let dataSources: object | undefined;

  try {
    let document;

    if (!displayInfo.document) {
      document = await services.multimodal.getDisplayDocument(displayInfo.currentDisplay!);

      if (!document) {
        return;
      }

      // Gracefully handle slightly malformed document
      if (document.dataSources) {
        dataSources = document.dataSources as object;
      }

      if (document.document) {
        ({ document } = document);
      }
    } else {
      try {
        document = JSON.parse(replaceVariables(displayInfo.document, variables));
      } catch (e) {
        // document not valid
      }
    }

    if (displayInfo.dataSource) {
      try {
        dataSources = JSON.parse(replaceVariables(displayInfo.dataSource, variables));
      } catch (e) {
        // DataSources not valid
      }
    }

    if (!dataSources) {
      return;
    }

    const results = deepFindVideos(document);

    results.forEach(({ item }) => {
      if (!item.id) {
        item.id = `${VIDEO_ID_PREFIX}_${randomstring.generate(6)}`;
      }

      if (!item.onEnd) {
        item.onEnd = getEventToSend(`${ENDED_EVENT_PREFIX}_${item.id}`);
      }

      if (!item.onPlay) {
        item.onPlay = getEventToSend(`${STARTED_EVENT_PREFIX}_${item.id}`);
      }
    });

    builder.addDirective({
      type: RENDER_DOCUMENT_DIRECTIVE_TYPE,
      token: context.versionID,
      document: document || undefined,
      datasources: dataSources,
    });

    context.storage.produce((state) => {
      const dInfo = state[S.DISPLAY_INFO] as DisplayInfo;

      dInfo.lastVariables = variables;

      delete dInfo.shouldUpdate;
      delete dInfo.shouldUpdateOnResume;
    });
  } catch (e) {
    // error
  }
};

export const CommandsResponseBuilder: ResponseBuilder = async (context, builder) => {
  const displayInfo = context.storage.get(S.DISPLAY_INFO) as DisplayInfo | undefined;

  if (!displayInfo?.commands) {
    return;
  }

  const { commands } = displayInfo;

  if (commands.length) {
    commands.forEach(({ type, command, componentId }) => {
      if (type === VideoCommandType.CONTROL_MEDIA && command === VideoCommand.PLAY) {
        context.storage.produce((storage) => {
          storage[S.DISPLAY_INFO].playingVideos[componentId] = { started: Date.now() };
        });
      }
    });
    builder.addDirective({
      type: 'Alexa.Presentation.APL.ExecuteCommands',
      token: context.versionID,
      commands,
    });
  }

  context.storage.produce((state) => {
    const dInfo = state[S.DISPLAY_INFO] as DisplayInfo;
    delete dInfo.commands;
  });
};

const DisplayResponseBuilder: ResponseBuilder = async (context, builder) => {
  await DocumentResponseBuilder(context, builder);
  await CommandsResponseBuilder(context, builder);
};

export default DisplayResponseBuilder;
