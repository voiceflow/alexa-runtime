export enum VideoCommandType {
  CONTROL_MEDIA = 'ControlMedia',
}

export enum VideoCommand {
  PLAY = 'play',
  PAUSE = 'pause',
}

export interface Command {
  type: VideoCommandType.CONTROL_MEDIA;
  delay?: number | string;
  description?: string;
  when?: boolean;
  command: VideoCommand;
  componentId: string;
  value?: number | string;
}

export type DisplayInfo = {
  playingVideos: Record<string, { started: number }>;
  dataSource?: string;
  commands?: Command[];
  shouldUpdate?: boolean;
  lastVariables?: Record<string, any>;
  currentDisplay?: number;
  lastDataSource?: string;
  dataSourceVariables?: string[];
  shouldUpdateOnResume?: boolean;
};

export type DisplayInfoV2 = {
  playingVideos: Record<string, { started: number }>;
  dataSource: string;
  document: string;
  commands?: Command[];
  shouldUpdate?: boolean;
  lastVariables?: Record<string, any>;
  lastDataSource?: string;
  dataSourceVariables?: string[];
  shouldUpdateOnResume?: boolean;
};
