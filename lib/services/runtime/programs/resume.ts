import { AlexaConstants } from '@voiceflow/alexa-types';
import { BaseNode } from '@voiceflow/base-types';
import { Frame, Program } from '@voiceflow/general-runtime/build/runtime';
import { VoiceModels } from '@voiceflow/voice-types';

import { IntentName } from '@/lib/services/runtime/types';

export const RESUME_PROGRAM_ID = '__RESUME_FLOW__';

export enum ResumeVariables {
  CONTENT = '__content0__',
  VOICE = '__voice0__',
  FOLLOW_CONTENT = '__content1__',
  FOLLOW_VOICE = '__voice1__',
}

export const promptToSSML = (content: string | undefined, voice: string | undefined) => {
  const contentValue = content ?? '';
  if (!voice || voice === 'Alexa' || !contentValue) {
    return contentValue;
  }
  if (voice === 'audio') {
    return `<audio src="${contentValue}"/>`;
  }
  return `<voice name="${voice}">${contentValue}</voice>`;
};

export const createResumeFrame = (
  resume: VoiceModels.Prompt<AlexaConstants.Voice>,
  follow: VoiceModels.Prompt<AlexaConstants.Voice> | null
) => {
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
