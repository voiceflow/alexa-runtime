import { ServerDataApiType } from './serverDataApi';

const DEFAULT_APL = {
  type: 'APL',
  version: '1.1',
  settings: {},
  theme: 'dark',
  import: [],
  resources: [],
  styles: {},
  onMount: [],
  graphics: {},
  commands: {},
  layouts: {},
  mainTemplate: {
    parameters: ['payload'],
    items: [
      {
        type: 'Container',
        items: [
          {
            type: 'Image',
            width: '100%',
            height: '100%',
            source: '${payload.documentData.url}', // eslint-disable-line no-template-curly-in-string
            scale: 'best-fit',
          },
        ],
        height: '100%',
        width: '100%',
      },
    ],
  },
};

class Multimodal {
  constructor(private serverDataApi: ServerDataApiType) {}

  getDisplayDocument = async (displayId: number): Promise<null | object> => {
    if (displayId < 0) {
      return DEFAULT_APL;
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
