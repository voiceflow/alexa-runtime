import { Context, Diagram, Frame, Store } from '@voiceflow/client';

export const RESUME_FLOW_ID = '__RESUME_FLOW__';

export enum ResumeFlowVariables {
  CONTENT = '__content0__',
  VOICE = '__voice0__',
  FOLLOW_CONTENT = '__content1__',
  FOLLOW_VOICE = '__voice1__',
}

export type ResumePrompt = {
  content: string;
  voice: string;
  follow_content: string;
  follow_voice: string;
};

export const createResumeFrame = (resumePrompt: ResumePrompt) => {
  return new Frame({
    diagramID: RESUME_FLOW_ID,
    variables: {
      [ResumeFlowVariables.CONTENT]: resumePrompt.content,
      [ResumeFlowVariables.VOICE]: resumePrompt.voice,
      [ResumeFlowVariables.FOLLOW_CONTENT]: resumePrompt.follow_content,
      [ResumeFlowVariables.FOLLOW_VOICE]: resumePrompt.follow_voice,
    },
  });
};

const ResumeFlowRaw = {
  id: RESUME_FLOW_ID,
  blocks: {
    1: {
      blockID: '1',
    },
  },
  startBlockID: '1',
};

export const ResumeFlow = new Diagram(ResumeFlowRaw);
