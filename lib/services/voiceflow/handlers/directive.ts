import { Node } from '@voiceflow/alexa-types/build/nodes/directive';
import { HandlerFactory, replaceVariables } from '@voiceflow/runtime';
import { Directive } from 'ask-sdk-model';
import _isString from 'lodash/isString';

import { T } from '@/lib/constants';

import { ResponseBuilder } from '../types';

export const DirectiveResponseBuilder: ResponseBuilder = (context, builder) => {
  const directives = context.turn.get(T.DIRECTIVES) as undefined | Directive[];
  if (directives) {
    directives.forEach((directive) => {
      builder.addDirective(directive);
    });
  }
};

const utilsObj = {
  replaceVariables,
};

export const DirectiveHandler: HandlerFactory<Node, typeof utilsObj> = (utils) => ({
  canHandle: (node) => {
    return _isString(node.directive);
  },
  handle: (node, context, variables) => {
    const { directive: unparsedDirective } = node;

    const directiveString = utils.replaceVariables(unparsedDirective, variables.getState());
    try {
      const directive = JSON.parse(directiveString) as Directive;
      context.turn.produce((draft) => {
        draft[T.DIRECTIVES] = [...(draft[T.DIRECTIVES] || []), directive];
      });
      context.trace.debug(`sending directive JSON:\n\`${directiveString}\``);
    } catch (err) {
      context.trace.debug(`invalid directive JSON:\n\`${directiveString}\`\n\`${err}\``);
    }

    return node.nextId;
  },
});

export default () => DirectiveHandler(utilsObj);
