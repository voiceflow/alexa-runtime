import randomstring from 'randomstring';

import { S } from '@/lib/constants';

import { ResponseBuilder } from '../../types';
import { regexVariables } from '../../utils';
import { ENDED_EVENT_PREFIX, RENDER_DOCUMENT_DIRECTIVE_TYPE, STARTED_EVENT_PREFIX, VIDEO_ID_PREFIX } from '../display/constants';
import { DisplayInfoV2, VideoCommand, VideoCommandType } from '../display/types';
import { deepFindVideos, getEventToSend } from '../display/utils';

export const DocumentResponseBuilderV2: ResponseBuilder = async (context, builder) => {
  const displayInfo = context.storage.get(S.DISPLAY_V2_INFO) as DisplayInfoV2 | undefined;

  if (!displayInfo?.shouldUpdate) {
    return;
  }

  const variables = context.variables.getState();

  try {
    let document;
    if (displayInfo.document) {
      try {
        document = JSON.parse(displayInfo.document);
      } catch (e) {
        // Document not valid
      }
    }

    if (!document) {
      return;
    }

    let dataSources: object | undefined;

    if (displayInfo.dataSource) {
      try {
        dataSources = JSON.parse(regexVariables(displayInfo.dataSource, variables));
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
      const dInfo = state[S.DISPLAY_V2_INFO] as DisplayInfoV2;

      dInfo.lastVariables = variables;

      delete dInfo.shouldUpdate;
      delete dInfo.shouldUpdateOnResume;
    });
  } catch (e) {
    // error
  }
};

export const CommandsResponseBuilderV2: ResponseBuilder = async (context, builder) => {
  const displayInfo = context.storage.get(S.DISPLAY_V2_INFO) as DisplayInfoV2 | undefined;

  if (!displayInfo?.commands) {
    return;
  }

  const { commands } = displayInfo;

  if (commands.length) {
    commands.forEach(({ type, command, componentId }) => {
      if (type === VideoCommandType.CONTROL_MEDIA && command === VideoCommand.PLAY) {
        context.storage.produce((storage) => {
          storage[S.DISPLAY_V2_INFO].playingVideos[componentId] = { started: Date.now() };
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
    const dInfo = state[S.DISPLAY_V2_INFO] as DisplayInfoV2;
    delete dInfo.commands;
  });
};

const DisplayResponseBuilder: ResponseBuilder = async (context, builder) => {
  await DocumentResponseBuilderV2(context, builder);
  await CommandsResponseBuilderV2(context, builder);
};

export default DisplayResponseBuilder;
