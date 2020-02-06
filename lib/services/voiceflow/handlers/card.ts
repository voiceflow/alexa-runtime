import { Handler, Store } from '@voiceflow/client';

import { T } from '@/lib/constants';

import { ResponseBuilder } from '../types';
import { regexVariables } from '../utils';

enum CardType {
  STANDARD = 'Standard',
  SIMPLE = 'Simple',
}

type Card = {
  type?: CardType;
  title?: string;
  text?: string;
  content?: string;
  image?: {
    smallImageUrl?: string;
    largeImageUrl?: string;
  };
};

export type CardBlock = {
  card: Card;
  nextId: string;
};

export const CardResponseBuilder: ResponseBuilder = (context, builder) => {
  const card: Required<Card> | undefined = context.turn.get(T.CARD);

  if (!card) {
    return;
  }

  if (card.type === CardType.SIMPLE) {
    builder.withSimpleCard(card.title, card.content);
  } else if (card.type === CardType.STANDARD) {
    builder.withStandardCard(card.title, card.text, card.image.smallImageUrl, card.image.largeImageUrl);
  }
};

const addVariables = (value: string | undefined, variables: Store, defaultValue = '') =>
  value ? regexVariables(value, variables.getState()) : defaultValue;

const CardHandler: Handler<CardBlock> = {
  canHandle: (block) => {
    return !!block.card;
  },
  handle: (block, context, variables) => {
    const { card } = block;

    const newCard: Required<Card> = {
      type: card.type ?? CardType.SIMPLE,
      title: addVariables(card.title, variables),
      text: addVariables(card.text, variables),
      content: addVariables(card.content, variables),
      image: {
        largeImageUrl: '',
        smallImageUrl: '',
      },
    };

    if (card.type === CardType.STANDARD && card.image?.largeImageUrl) {
      newCard.image.largeImageUrl = addVariables(card.image.largeImageUrl, variables);
      newCard.image.smallImageUrl = addVariables(card.image.smallImageUrl, variables, card.image.largeImageUrl);
    }

    context.turn.set(T.CARD, newCard);

    return block.nextId;
  },
};

export default CardHandler;
