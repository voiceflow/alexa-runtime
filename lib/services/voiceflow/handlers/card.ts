import { HandlerFactory, Store } from '@voiceflow/client';

import { T } from '@/lib/constants';

import { ResponseBuilder } from '../types';
import { regexVariables } from '../utils';

export enum CardType {
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

export const addVariables = (regex: typeof regexVariables) => (value: string | undefined, variables: Store, defaultValue = '') =>
  value ? regex(value, variables.getState()) : defaultValue;

const utilsObj = {
  addVariables: addVariables(regexVariables),
};

export const CardHandler: HandlerFactory<CardBlock, typeof utilsObj> = (utils) => ({
  canHandle: (block) => {
    return !!block.card;
  },
  handle: (block, context, variables) => {
    const { card } = block;

    const newCard: Required<Card> = {
      type: card.type ?? CardType.SIMPLE,
      title: utils.addVariables(card.title, variables),
      text: utils.addVariables(card.text, variables),
      content: utils.addVariables(card.content, variables),
      image: {
        largeImageUrl: '',
        smallImageUrl: '',
      },
    };

    if (card.type === CardType.STANDARD && card.image?.largeImageUrl) {
      newCard.image.largeImageUrl = utils.addVariables(card.image.largeImageUrl, variables);
      newCard.image.smallImageUrl = utils.addVariables(card.image.smallImageUrl, variables, newCard.image.largeImageUrl);
    }

    context.turn.set(T.CARD, newCard);

    return block.nextId;
  },
});

export default () => CardHandler(utilsObj);
