import { Handler } from '@voiceflow/client';

const StartHandler: Handler = {
  canHandle: (block) => {
    return Object.keys(block).length === 2 && block.nextId;
  },
  handle: (block) => {
    return block.nextId;
  },
};

export default StartHandler;
