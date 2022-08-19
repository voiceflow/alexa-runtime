import { BaseNode } from '@voiceflow/base-types';
import { replaceVariables } from '@voiceflow/common';
import { HandlerFactory, Store } from '@voiceflow/general-runtime/build/runtime';

import { T } from '@/lib/constants';

import { ResponseBuilder } from '../types';

export const CardResponseBuilder: ResponseBuilder = (runtime, builder) => {
  const card: Required<BaseNode.Card.Card> | undefined = runtime.turn.get(T.CARD);

  if (!card) {
    return;
  }

  if (card.type === BaseNode.Card.CardType.SIMPLE) {
    builder.withSimpleCard(card.title, card.text);
  } else if (card.type === BaseNode.Card.CardType.STANDARD) {
    builder.withStandardCard(card.title, card.text, card.image.smallImageUrl, card.image.largeImageUrl);
  }
};

export const addVariables = (regex: typeof replaceVariables) => (
  value: string | undefined,
  variables: Store,
  defaultValue = ''
) => (value ? regex(value, variables.getState()) : defaultValue);

const utilsObj = {
  addVariables: addVariables(replaceVariables),
};

export const CardHandler: HandlerFactory<BaseNode.Card.Node, typeof utilsObj> = (utils) => ({
  canHandle: (node) => !!node.card,
  handle: (node, runtime, variables) => {
    runtime.trace.debug('__CARD ALR__ - entered', BaseNode.NodeType.CARD);
    const { card } = node;
    const type = card.type ?? BaseNode.Card.CardType.SIMPLE;

    // FIXME: remove after data refactoring
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { content } = card;

    const text = (type === BaseNode.Card.CardType.SIMPLE ? content : card.text) ?? card.text;

    const newCard: Required<BaseNode.Card.Card> = {
      type,
      text: utils.addVariables(text, variables),
      title: utils.addVariables(card.title, variables),
      image: {
        largeImageUrl: '',
        smallImageUrl: '',
      },
    };

    if (card.type === BaseNode.Card.CardType.STANDARD && card.image?.largeImageUrl) {
      newCard.image.largeImageUrl = utils.addVariables(card.image.largeImageUrl, variables);
      newCard.image.smallImageUrl = utils.addVariables(
        card.image.smallImageUrl,
        variables,
        newCard.image.largeImageUrl
      );
    }

    runtime.turn.set(T.CARD, newCard);
    runtime.trace.addTrace<BaseNode.Card.TraceFrame>({
      type: BaseNode.Utils.TraceType.CARD,
      payload: { ...newCard, type: BaseNode.Card.CardType.SIMPLE },
    });

    return node.nextId ?? null;
  },
});

export default () => CardHandler(utilsObj);
