import { Context } from '@voiceflow/client';

export enum TraceType {
  BLOCK = 'block',
  SPEAK = 'speak',
  FLOW = 'flow',
  STREAM = 'stream',
  DEBUG = 'debug',
}

export const addBlockTrace = (context: Context, blockID: string) =>
  context.addTrace({
    type: TraceType.BLOCK,
    payload: { blockID },
  });

export const addSpeakTrace = (context: Context, message: string) =>
  context.addTrace({
    type: TraceType.SPEAK,
    payload: { message },
  });

export const addFlowTrace = (context: Context, diagramID: string) =>
  context.addTrace({
    type: TraceType.FLOW,
    payload: { diagramID },
  });

export const addDebugTrace = (context: Context, message: string) =>
  context.addTrace({
    type: TraceType.DEBUG,
    payload: { message },
  });
