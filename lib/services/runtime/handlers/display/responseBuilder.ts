import { replaceVariables } from '@voiceflow/common';
import { SupportedInterfaces } from 'ask-sdk-model';
import randomstring from 'randomstring';

import { S } from '@/lib/constants';
import { FullServiceMap } from '@/lib/services';
import { ResponseBuilder } from '@/lib/services/runtime/types';

import {
  APL_INTERFACE_NAME,
  ENDED_EVENT_PREFIX,
  RENDER_DOCUMENT_DIRECTIVE_TYPE,
  STARTED_EVENT_PREFIX,
  VIDEO_ID_PREFIX,
} from './constants';
import { DisplayInfo, VideoCommand, VideoCommandType } from './types';
import { deepFindVideos, getEventToSend } from './utils';

// eslint-disable-next-line sonarjs/cognitive-complexity
export const DocumentResponseBuilder: ResponseBuilder = async (runtime, builder) => {
  const displayInfo = runtime.storage.get(S.DISPLAY_INFO) as DisplayInfo | undefined;
  const supportedInterfaces = runtime.storage.get<SupportedInterfaces | undefined>(S.SUPPORTED_INTERFACES);

  if (
    !supportedInterfaces?.[APL_INTERFACE_NAME] ||
    !displayInfo?.shouldUpdate ||
    (displayInfo.currentDisplay === undefined && !displayInfo.document)
  ) {
    return;
  }

  const variables = runtime.variables.getState();
  const services = runtime.services as FullServiceMap;

  let dataSources: Record<string, any> | undefined;

  try {
    let document;

    if (!displayInfo.document) {
      document = await services.multimodal.getDisplayDocument(displayInfo.currentDisplay!, runtime.version);

      if (!document) {
        return;
      }

      // Gracefully handle slightly malformed document
      if (document.dataSources) {
        dataSources = document.dataSources as Record<string, any>;
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

    if (results?.length) {
      // you can not end the session, but if false, it will trigger a prompt
      builder.withShouldEndSession(undefined!);
    }

    builder.addDirective({
      type: RENDER_DOCUMENT_DIRECTIVE_TYPE,
      token: runtime.versionID,
      document: document || undefined,
      datasources: dataSources,
    });

    runtime.storage.produce((state) => {
      const dInfo = state[S.DISPLAY_INFO] as DisplayInfo;

      dInfo.lastVariables = variables;

      delete dInfo.shouldUpdate;
      delete dInfo.shouldUpdateOnResume;
    });
  } catch (e) {
    // error
  }
};

export const CommandsResponseBuilder: ResponseBuilder = async (runtime, builder) => {
  const displayInfo = runtime.storage.get(S.DISPLAY_INFO) as DisplayInfo | undefined;

  if (!displayInfo?.commands) {
    return;
  }

  const { commands } = displayInfo;

  if (commands.length) {
    commands.forEach(({ type, command, componentId }) => {
      if (type === VideoCommandType.CONTROL_MEDIA && command === VideoCommand.PLAY) {
        runtime.storage.produce((storage) => {
          storage[S.DISPLAY_INFO].playingVideos[componentId] = { started: Date.now() };
        });
      }
    });
    builder.addDirective({
      type: 'Alexa.Presentation.APL.ExecuteCommands',
      token: runtime.versionID,
      commands,
    });
  }

  runtime.storage.produce((state) => {
    const dInfo = state[S.DISPLAY_INFO] as DisplayInfo;
    delete dInfo.commands;
  });
};

const DisplayResponseBuilder: ResponseBuilder = async (runtime, builder) => {
  await DocumentResponseBuilder(runtime, builder);
  await CommandsResponseBuilder(runtime, builder);
};

export default DisplayResponseBuilder;
