import { expect } from 'chai';

import getBestScore, { Choice } from '@/lib/services/test/handlers/choice/score';

describe('score utils', () => {
  describe('getBestScore', () => {
    it('no input', () => {
      expect(getBestScore(null as any, null as any)).to.eql(null);
    });

    it('finds best choice', () => {
      const input = 'yep';
      const choice = { value: 'yes', index: 1 };
      const choices: Choice[] = [
        { value: 'no', index: 0 },
        { value: 'nah', index: 0 },
        choice,
        { value: 'yup', index: 1 },
        { value: 'yeah', index: 1 },
        {} as any, // handles choice without value
      ];

      expect(getBestScore(input, choices)).to.eql(choice);
    });

    it('does not find choice', () => {
      const input = 'cat';
      const choices: Choice[] = [
        { value: 'no', index: 0 },
        { value: 'nah', index: 0 },
        { value: 'yes', index: 1 },
        { value: 'yup', index: 1 },
        { value: 'yeah', index: 1 },
      ];

      expect(getBestScore(input, choices)).to.eql(null);
    });
  });
});
