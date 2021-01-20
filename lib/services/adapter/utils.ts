import { interfaces } from 'ask-sdk-model';

import { Commands, NewStateStack, NewStateStorage, NewStateVariables, OldCommands, OldStateRaw } from './types';

export const commandAdapter = (oldCommands: OldCommands): Commands =>
  Object.keys(oldCommands).reduce((commandsAcc, key) => {
    const oldCommand = oldCommands[key];
    const command = {
      mappings: oldCommand.mappings,
      intent: key,
      ...(oldCommand.diagram_id && { diagram_id: oldCommand.diagram_id }), // command
      ...(oldCommand.next && { next: oldCommand.next }), // intent
    };
    commandsAcc.push(command);

    return commandsAcc;
  }, [] as Commands);

export const stackAdapter = (oldState: OldStateRaw): NewStateStack =>
  oldState.diagrams?.reduce((acc, d, index) => {
    const frame = {
      nodeID: d.line === false ? null : d.line,
      programID: d.id,
      variables: d.variable_state,
      storage: {
        // speak is only added in the old server during commands
        ...(d.speak && { speak: d.speak, calledCommand: true }),
        // output map is stored in previous frame in old server
        ...(oldState.diagrams[index - 1]?.output_map && { outputMap: oldState.diagrams[index - 1].output_map }),
      } as any,
      commands: commandAdapter(d.commands),
    };

    if (index === oldState.diagrams.length - 1) {
      // nodeID for top of the stack frame is kept in line_id in old runtime
      frame.nodeID = oldState.line_id;
      // old server only keeps what the last diagram spoke
      if (oldState.last_speak) frame.storage.speak = oldState.last_speak;
    }

    acc.push(frame);

    return acc;
  }, [] as NewStateStack) || [];

type StorageAdapterOptions = { accessToken: string | undefined };

export const storageAdapter = (oldState: OldStateRaw, { accessToken }: StorageAdapterOptions): NewStateStorage => ({
  output: oldState.output,
  sessions: oldState.sessions,
  repeat: oldState.repeat,
  locale: oldState.locale,
  user: oldState.user,
  alexa_permissions: oldState.alexa_permissions,
  supported_interfaces: oldState.supported_interfaces,
  // conditionally add attributes
  ...(accessToken && { accessToken }),
  ...(oldState.randoms && { randoms: oldState.randoms }),
  ...(oldState.permissions && { permissions: oldState.permissions }),
  ...(oldState.payment && {
    payment: {
      productId: oldState.payment.productId,
      successPath: oldState.payment.success,
      failPath: oldState.payment.fail,
      status: oldState.payment.result || null,
    },
  }),
  ...(oldState.cancel_payment && {
    cancelPayment: {
      productId: oldState.cancel_payment.productId,
      successPath: oldState.cancel_payment.success,
      failPath: oldState.cancel_payment.fail,
      status: oldState.cancel_payment.result || null,
    },
  }),
  ...(oldState.display_info && {
    displayInfo: {
      playingVideos: oldState.display_info.playing_videos,
      dataSource: oldState.display_info.datasource,
      commands: oldState.display_info.commands,
      shouldUpdate: oldState.display_info.should_update,
      currentDisplay: oldState.display_info.current_display,
      lastDataSource: oldState.display_info.last_datasource,
      dataSourceVariables: oldState.display_info.datasource_variables,
      shouldUpdateOnResume: oldState.display_info.should_update_on_resume,
      // lastVariables -> to populate with variables
    },
  }),
  ...(oldState.play && {
    streamPlay: {
      action: oldState.play.action,
      url: oldState.play.url,
      loop: oldState.play.loop,
      offset: oldState.play.offset,
      nextId: oldState.play.nextId,
      token: oldState.play.token,
      PAUSE_ID: oldState.play.PAUSE_ID,
      NEXT: oldState.play.NEXT,
      PREVIOUS: oldState.play.PREVIOUS,
      title: oldState.play.title,
      description: oldState.play.description,
      regex_title: oldState.play.regex_title,
      regex_description: oldState.play.regex_description,
      icon_img: oldState.play.icon_img,
      background_img: oldState.play.background_img,
    },
  }),
  ...(oldState.pause && {
    streamPause: {
      id: oldState.pause.id,
      offset: oldState.pause.offset,
    },
  }),
  ...(oldState.finished !== undefined && {
    streamFinished: oldState.finished,
  }),
});

type VariablesAdapterOptions = { system: interfaces.system.SystemState };

export const variablesAdapter = (oldState: OldStateRaw, { system }: VariablesAdapterOptions): NewStateVariables =>
  oldState.globals[0]
    ? { ...oldState.globals[0], _system: system }
    : { voiceflow: { events: [], permissions: [], capabilities: {} }, _system: system };

// modify runtime before running adapters
export const beforeContextModifier = ({ ...runtime }: OldStateRaw) => {
  // modifier when old runtime has temp
  if (runtime.temp) {
    const { temp, next_line, next_play, ...tempState } = runtime;
    tempState.play = next_play;
    tempState.line_id = next_line || null;
    tempState.diagrams = temp.diagrams;
    tempState.globals = temp.globals;
    tempState.randoms = temp.randoms;
    runtime = tempState;
  }

  return runtime;
};

// modify storage after running adapters
export const afterStorageModifier = ({ ...storage }: NewStateStorage, { ...variables }: NewStateVariables) => {
  // modifier when new storage has displayInfo
  if (storage.displayInfo) storage.displayInfo.lastVariables = variables;

  return storage;
};
