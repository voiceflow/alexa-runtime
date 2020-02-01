import { T } from '@/lib/constants';

import { Handler, ResponseBuilder } from '../types';
import { regexVariables } from '../utils';

enum CardType {
  STANDARD = 'Standard',
  SIMPLE = 'Simple',
}

export const CardResponseBuilder: ResponseBuilder = (context, builder) => {
  const card = context.turn.get(T.CARD);
  if (card) {
    if (card.type === CardType.SIMPLE) builder.withSimpleCard(card.title, card.content);
    else if (card.type === CardType.STANDARD) builder.withStandardCard(card.title, card.text, card.image.smallImageUrl, card.image.largeImageUrl);
  }
};

const CardHandler: Handler = {
  canHandle: (block) => {
    return !!block.card;
  },
  handle: (block, context, variables) => {
    const { card } = block;
    const newCard = {
      type: card.type,
      title: '',
      text: '',
      content: '',
      image: {
        largeImageUrl: '',
        smallImageUrl: '',
      },
    };

    if (card.title) newCard.title = regexVariables(card.title, variables.getState());
    if (card.text) newCard.text = regexVariables(card.text, variables.getState());
    if (card.content) newCard.content = regexVariables(card.content, variables.getState());

    if (card.type === CardType.STANDARD && card.image?.largeImageUrl) {
      newCard.image.largeImageUrl = regexVariables(card.image.largeImageUrl, variables.getState());
      newCard.image.smallImageUrl = card.image.smallImageUrl
        ? regexVariables(card.image.smallImageUrl, variables.getState())
        : newCard.image.largeImageUrl;
    }

    context.turn.set(T.CARD, newCard);

    return block.nextId;
  },
};

export default CardHandler;
