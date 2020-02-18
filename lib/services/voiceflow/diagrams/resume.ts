import { Diagram, Frame } from '@voiceflow/client';

export const RESUME_DIAGRAM_ID = '__RESUME_FLOW__';

export enum ResumeVariables {
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
    diagramID: RESUME_DIAGRAM_ID,
    variables: {
      [ResumeVariables.CONTENT]: resumePrompt.content,
      [ResumeVariables.VOICE]: resumePrompt.voice,
      [ResumeVariables.FOLLOW_CONTENT]: resumePrompt.follow_content ?? '',
      [ResumeVariables.FOLLOW_VOICE]: resumePrompt.follow_voice,
    },
  });
};

const ResumeDiagramRaw = {
  id: RESUME_DIAGRAM_ID,
  blocks: {
    1: {
      blockID: '1',
      speak: `<voice name="${ResumeVariables.VOICE}">{${ResumeVariables.CONTENT}}</voice>`,
      nextId: '2',
    },
    2: {
      blockID: '2',
      interactions: [
        {
          intent: 'AMAZON.YesIntent',
          mappings: [],
        },
        {
          intent: 'AMAZON.NoIntent',
          mappings: [],
        },
      ],
      nextIds: ['3', '4'],
      elseId: '3',
    },
    3: {
      blockID: '3',
      speak: `<voice name="${ResumeVariables.FOLLOW_VOICE}">{${ResumeVariables.FOLLOW_CONTENT}}</voice>`,
    },
    4: {
      blockID: '4',
      reset: true,
    },
  },
  startBlockID: '1',
};

export const ResumeDiagram = new Diagram(ResumeDiagramRaw);
