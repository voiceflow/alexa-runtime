import { ServerDataApiType } from './serverDataApi';

class Multimodal {
  constructor(private serverDataApi: ServerDataApiType) {}

  getDisplayDocument = async (displayId: number): Promise<null | Record<string, any>> => {
    if (displayId < 0) {
      return null;
    }

    try {
      const data = await this.serverDataApi.fetchDisplayById(displayId);

      if (!data?.document) {
        return null;
      }

      return JSON.parse(data?.document);
    } catch (e) {
      return null;
    }
  };
}

const MultimodalClient = (serverDataApi: ServerDataApiType) => new Multimodal(serverDataApi);

export type MultimodalType = Multimodal;

export default MultimodalClient;
