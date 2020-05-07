import { HandlerInput } from 'ask-sdk';
import { interfaces } from 'ask-sdk-model';

import { Commands, NewContextStack, NewContextStorage, NewContextVariables, NewVoiceflowVars, OldCommands, OldContextRaw } from './types';

export const commandAdapter = (oldCommands: OldCommands): Commands =>
  Object.keys(oldCommands).reduce((commandsAcc, key) => {
    const oldCommand = oldCommands[key];
    const command = {
      mappings: oldCommand.mappings,
      intent: key,
      ...(oldCommand.diagram_id && { diagram_id: oldCommand.diagram_id }), // command
      ...(oldCommand.end !== undefined && { end: oldCommand.end }), // command
      ...(oldCommand.next && { next: oldCommand.next }), // intent
    };
    commandsAcc.push(command);

    return commandsAcc;
  }, [] as Commands);

export const stackAdapter = (oldContext: OldContextRaw): NewContextStack =>
  oldContext.diagrams?.reduce((acc, d, index) => {
    const frame = {
      blockID: d.line === false ? null : d.line,
      diagramID: d.id,
      variables: d.variable_state,
      storage: {
        // output map is stored in previous frame in old server
        ...(oldContext.diagrams[index - 1]?.output_map && { outputMap: oldContext.diagrams[index - 1].output_map }),
        // speak: stores the output each frame produces. we dont keep track of this in old server
      } as any,
      commands: commandAdapter(d.commands),
    };

    // blockID for top of the stack frame is kept in line_id in old context
    if (index === oldContext.diagrams.length - 1) {
      frame.blockID = oldContext.line_id;
      // old server only keeps what the last diagram spoke
      if (oldContext.last_speak) frame.storage.speak = oldContext.last_speak;
    }

    acc.push(frame);

    return acc;
  }, [] as NewContextStack) || [];

export const storageAdapter = (oldContext: OldContextRaw, input: HandlerInput): NewContextStorage => ({
  output: oldContext.output,
  sessions: oldContext.sessions,
  repeat: oldContext.repeat,
  locale: oldContext.locale,
  user: oldContext.user,
  alexa_permissions: oldContext.alexa_permissions,
  supported_interfaces: oldContext.supported_interfaces,
  ...(input.requestEnvelope.context.System.user.accessToken && { accessToken: input.requestEnvelope.context.System.user.accessToken }),
  ...(oldContext.randoms && { randoms: oldContext.randoms }), // conditionally add randoms
});

export const variablesAdapter = (oldContext: OldContextRaw, system: interfaces.system.SystemState): NewContextVariables =>
  oldContext.globals[0]
    ? {
        // everything in variables
        ...oldContext.globals[0],
        _system: system,
        // filter out deprecated vars in vf specific variables
        voiceflow: Object.keys(oldContext.globals[0].voiceflow).reduce(
          (acc, key) => {
            if (['events'].includes(key)) {
              acc[key] = oldContext.globals[0].voiceflow[key];
            }

            return acc;
          },
          // initial object
          { permissions: oldContext.alexa_permissions, capabilities: oldContext.supported_interfaces } as NewVoiceflowVars
        ),
      }
    : { voiceflow: { events: [], permissions: [], capabilities: {} }, _system: system }; // default
