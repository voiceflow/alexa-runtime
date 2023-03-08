import { DataAPI } from '@voiceflow/general-runtime/build/runtime';
import _isEqual from 'lodash/isEqual';

import log from '@/logger';

class Multimodal {
  constructor(private dataAPI: DataAPI) {}

  getDisplayDocument = async (displayId: number, version?: any): Promise<null | Record<string, any>> => {
    if (displayId < 0) {
      return null;
    }

    try {
      const data = await this.dataAPI.fetchDisplayById(displayId);

      if (!data?.document) {
        return null;
      }

      const document = JSON.parse(data.document);

      try {
        log.warn(
          `[display init] displayId: ${displayId} version: ${!!version}, displays: ${!!version?.platformData?.displays}`
        );
        log.warn(
          `[display check] displayId: ${displayId} ${_isEqual(
            document,
            JSON.parse(version?.platformData?.displays?.[displayId])
          )}`
        );
      } catch (e) {
        log.warn(`[display check] displayId: ${displayId} ERROR ${e}`);
      }

      return document;
    } catch (e) {
      return null;
    }
  };
}

const MultimodalClient = (dataAPI: DataAPI) => new Multimodal(dataAPI);

export type MultimodalType = Multimodal;

export default MultimodalClient;
