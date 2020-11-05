import { DataAPI } from '@voiceflow/runtime';

class Multimodal {
  constructor(private dataAPI: DataAPI) {}

  getDisplayDocument = async (displayId: number): Promise<null | Record<string, any>> => {
    if (displayId < 0) {
      return null;
    }

    try {
      const data = await this.dataAPI.fetchDisplayById(displayId);

      if (!data?.document) {
        return null;
      }

      return JSON.parse(data.document);
    } catch (e) {
      return null;
    }
  };
}

const MultimodalClient = (dataAPI: DataAPI) => new Multimodal(dataAPI);

export type MultimodalType = Multimodal;

export default MultimodalClient;
