import { AlexaCommands, AlexaNodes, AlexaVersionData } from '@voiceflow/alexa-types';
import { Program, Version } from '@voiceflow/api-sdk';
import { ServerDataApi } from '@voiceflow/runtime';

class PrototypeServerDataApi extends ServerDataApi<Program<AlexaNodes, AlexaCommands>, Version<AlexaVersionData>> {
  public getProgram = async (programID: string) => {
    const { data } = await this.client.get<Program<AlexaNodes, AlexaCommands>>(`/test/diagrams/${programID}`);

    return data;
  };
}

export default PrototypeServerDataApi;
