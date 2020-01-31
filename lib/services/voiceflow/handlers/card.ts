import _ from 'lodash';

import { T } from '@/lib/constants';

import { Handler } from '../types';
import { regexVariables } from '../utils';

enum CardType {
  STANDARD = 'Standard',
}

const PermissionCardHandler: Handler = {
  canHandle: (block) => {
    return !!block.card;
  },
  handle: (block, context, variables) => {
    const card = _.cloneDeep(block.card);

    if (card.title) card.title = regexVariables(card.title, variables.getState());
    if (card.text) card.text = regexVariables(card.text, variables.getState());
    if (card.content) card.content = regexVariables(card.content, variables.getState());

    if (card.type === CardType.STANDARD && card.image?.largeImageUrl) {
      card.image.largeImageUrl = regexVariables(card.image.largeImageUrl, variables.getState());
      card.image.smallImageUrl = card.image.smallImageUrl ? regexVariables(card.image.smallImageUrl, variables.getState()) : card.image.largeImageUrl;
    }

    context.turn.set(T.CARD, card);

    return block.nextId;
  },
};

export default PermissionCardHandler;
