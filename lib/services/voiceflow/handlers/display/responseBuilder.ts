import { interfaces } from 'ask-sdk-model';
import _ from 'lodash';
import randomstring from 'randomstring';

import { S } from '@/lib/constants';
import { FullServiceMap } from '@/lib/services';

import { ResponseBuilder } from '../../types';
import { regexVariables } from '../../utils';
import { ENDED_EVENT_PREFIX, RENDER_DOCUMENT_DIRECTIVE_TYPE, STARTED_EVENT_PREFIX, VIDEO_ID_PREFIX } from './constants';
import { deepFindVideos, getEventToSend, shouldRebuildDisplay } from './utils';

export type DisplayInfo = {
  commands?: interfaces.alexa.presentation.apl.Command[] | string;
  dataSource?: string;
  lastVariables?: Record<string, any>;
  playingVideos?: Record<string, { started: number }>;
  currentDisplay?: number;
  lastDataSource?: string;
  dataSourceVariables?: string[];
  shouldUpdateOnResume?: boolean;
};

const DocumentResponseBuilder: ResponseBuilder = async (context, builder) => {
  const displayInfo = context.storage.get(S.DISPLAY_INFO) as DisplayInfo | undefined;
  const variables = context.variables.getState();

  if (
    !displayInfo ||
    !shouldRebuildDisplay(displayInfo.dataSourceVariables, variables, displayInfo.lastVariables) ||
    displayInfo.currentDisplay === undefined
  ) {
    return;
  }

  const services = context.services as FullServiceMap;

  try {
    let document = await services.multimodal.getDisplayDocument(displayInfo.currentDisplay);

    if (!document) {
      return;
    }

    let dataSources: object | undefined;

    // Gracefully handle slightly malformed document
    if (document.dataSources) {
      dataSources = document.dataSources as object;
    }

    if (document.document) {
      ({ document } = document);
    }

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
      token: services.hashids.encode(context.versionID),
      document: document || undefined,
      datasources: dataSources,
    });

    context.storage.produce((state) => {
      const dInfo = state[S.DISPLAY_INFO] as DisplayInfo;

      dInfo.lastVariables = variables;

      delete dInfo.shouldUpdateOnResume;
    });
  } catch (e) {
    // error
  }
};

const CommandsResponseBuilder: ResponseBuilder = async (context, builder) => {
  const displayInfo = context.storage.get(S.DISPLAY_INFO) as DisplayInfo | undefined;

  if (!displayInfo?.commands) {
    return;
  }

  let { commands } = displayInfo;
  const services = context.services as FullServiceMap;

  if (_.isString(commands)) {
    try {
      commands = JSON.parse(commands) as interfaces.alexa.presentation.apl.Command[];
    } catch {
      return;
    }
  }

  if (commands) {
    builder.addDirective({
      type: 'Alexa.Presentation.APL.ExecuteCommands',
      token: services.hashids.encode(context.versionID),
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
