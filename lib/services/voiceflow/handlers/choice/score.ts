import dice from 'talisman/metrics/dice';
import jaccard from 'talisman/metrics/jaccard';

export type Choice = { value: string; index: number };

const getBestScore = (input: string, choices: Array<Choice>, tolerance = 0.9): number | null => {
  if (!input) return null;

  const best: { choice: null | Choice; score: number } = {
    choice: null,
    score: tolerance,
  };

  choices.forEach((choice) => {
    if (!choice.value) return;

    const sanitizedInput = input.toLowerCase();
    const match = choice.value.toLowerCase();
    let tempScore = jaccard(sanitizedInput, match) + dice(sanitizedInput, match);

    if (input.charAt(0) === match.charAt(0)) {
      tempScore += 0.1;
    }

    if (tempScore > best.score) {
      best.choice = choice;
      best.score = tempScore;
    }
  });

  return best.choice?.index ?? null;
};

export default getBestScore;
