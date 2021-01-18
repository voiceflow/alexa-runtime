import { AlexaProgram, AlexaVersion } from '@voiceflow/alexa-types';
import { ServerDataApi } from '@voiceflow/runtime';

class PrototypeServerDataApi extends ServerDataApi<AlexaProgram, AlexaVersion> {
  public getProgram = async (programID: string) => {
    const { data } = await this.client.get<AlexaProgram>(`/test/diagrams/${programID}`);

    return data;
  };
}

export default PrototypeServerDataApi;
