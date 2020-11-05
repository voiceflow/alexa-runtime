import { Card, CardType, Node } from '@voiceflow/alexa-types/build/nodes/card';
import { HandlerFactory, replaceVariables, Store } from '@voiceflow/runtime';

import { T } from '@/lib/constants';

import { ResponseBuilder } from '../types';

export const CardResponseBuilder: ResponseBuilder = (context, builder) => {
  const card: Required<Card> | undefined = context.turn.get(T.CARD);

  if (!card) {
    return;
  }

  if (card.type === CardType.SIMPLE) {
    builder.withSimpleCard(card.title, card.text);
  } else if (card.type === CardType.STANDARD) {
    builder.withStandardCard(card.title, card.text, card.image.smallImageUrl, card.image.largeImageUrl);
  }
};

export const addVariables = (regex: typeof replaceVariables) => (value: string | undefined, variables: Store, defaultValue = '') =>
  value ? regex(value, variables.getState()) : defaultValue;

const utilsObj = {
  addVariables: addVariables(replaceVariables),
};

export const CardHandler: HandlerFactory<Node, typeof utilsObj> = (utils) => ({
  canHandle: (node) => !!node.card,
  handle: (node, context, variables) => {
    const { card } = node;
    const type = card.type ?? CardType.SIMPLE;

    // FIXME: remove after data refactoring
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    const { content } = card;

    const text = (type === CardType.SIMPLE ? content : card.text) ?? card.text;

    const newCard: Required<Card> = {
      type,
      text: utils.addVariables(text, variables),
      title: utils.addVariables(card.title, variables),
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

    return node.nextId ?? null;
  },
});

export default () => CardHandler(utilsObj);
