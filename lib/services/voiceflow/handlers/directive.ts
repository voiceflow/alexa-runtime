import { HandlerFactory } from '@voiceflow/client';
import { Directive } from 'ask-sdk-model';
import _isString from 'lodash/isString';

import { T } from '@/lib/constants';

import { ResponseBuilder } from '../types';
import { regexVariables } from '../utils';

export type DirectiveBlock = {
  directive: string;
  nextId: string;
};

export const DirectiveResponseBuilder: ResponseBuilder = (context, builder) => {
  const directives = context.turn.get(T.DIRECTIVES) as undefined | Directive[];
  if (directives) {
    directives.forEach((directive) => {
      builder.addDirective(directive);
    });
  }
};

const utilsObj = {
  regexVariables,
};

export const DirectiveHandler: HandlerFactory<DirectiveBlock, typeof utilsObj> = (utils) => ({
  canHandle: (block) => {
    return _isString(block.directive);
  },
  handle: (block, context, variables) => {
    const { directive: unparsedDirective } = block;

    const directiveString = utils.regexVariables(unparsedDirective, variables.getState());
    try {
      const directive = JSON.parse(directiveString) as Directive;
      context.turn.produce((draft) => {
        draft[T.DIRECTIVES] = [...(draft[T.DIRECTIVES] || []), directive];
      });
      context.trace.debug(`sending directive JSON:\n\`${directiveString}\``);
    } catch (err) {
      context.trace.debug(`invalid directive JSON:\n\`${directiveString}\`\n\`${err}\``);
    }

    return block.nextId;
  },
});

export default () => DirectiveHandler(utilsObj);
