import { ServerDataAPIType } from './serverDataAPI';

class Multimodal {
  constructor(private serverDataAPI: ServerDataAPIType) {}

  getDisplayDocument = async (displayId: number): Promise<null | Record<string, any>> => {
    if (displayId < 0) {
      return null;
    }

    try {
      const data = await this.serverDataAPI.fetchDisplayById(displayId);

      if (!data?.document) {
        return null;
      }

      return JSON.parse(data.document);
    } catch (e) {
      return null;
    }
  };
}

const MultimodalClient = (serverDataAPI: ServerDataAPIType) => new Multimodal(serverDataAPI);

export type MultimodalType = Multimodal;

export default MultimodalClient;
