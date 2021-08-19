import { Constants } from '@voiceflow/alexa-types';
import { Node as BaseNode } from '@voiceflow/base-types';
import { Frame, Program } from '@voiceflow/general-runtime/build/runtime';
import { Types as VoiceTypes } from '@voiceflow/voice-types';

import { IntentName } from '@/lib/services/runtime/types';

export const RESUME_PROGRAM_ID = '__RESUME_FLOW__';

export enum ResumeVariables {
  CONTENT = '__content0__',
  VOICE = '__voice0__',
  FOLLOW_CONTENT = '__content1__',
  FOLLOW_VOICE = '__voice1__',
}

export const promptToSSML = (content = '', voice: string | undefined) => {
  if (!voice || voice === 'Alexa' || !content) {
    return content;
  }
  if (voice === 'audio') {
    return `<audio src="${content}"/>`;
  }
  return `<voice name="${voice}">${content}</voice>`;
};

export const createResumeFrame = (resume: VoiceTypes.Prompt<Constants.Voice>, follow: VoiceTypes.Prompt<Constants.Voice> | null) => {
  return new Frame({
    programID: RESUME_PROGRAM_ID,
    variables: {
      [ResumeVariables.CONTENT]: promptToSSML(resume.content, resume.voice),
      [ResumeVariables.FOLLOW_CONTENT]: follow ? promptToSSML(follow.content, follow.voice) : '',
    },
  });
};

const ResumeDiagramRaw = {
  id: RESUME_PROGRAM_ID,
  lines: {
    1: {
      id: '1',
      type: BaseNode.NodeType.SPEAK,
      speak: `{${ResumeVariables.CONTENT}}`,
      nextId: '2',
    },
    2: {
      id: '2',
      type: BaseNode.NodeType.INTERACTION,
      interactions: [
        {
          intent: IntentName.YES,
          mappings: [],
        },
        {
          intent: IntentName.NO,
          mappings: [],
        },
      ],
      nextIds: ['3', '4'],
      elseId: '3',
    },
    3: {
      type: BaseNode.NodeType.SPEAK,
      id: '3',
      speak: `{${ResumeVariables.FOLLOW_CONTENT}}`,
    },
    4: {
      type: 'reset',
      id: '4',
      reset: true,
    },
  },
  startId: '1',
};

export const ResumeDiagram = new Program(ResumeDiagramRaw);
