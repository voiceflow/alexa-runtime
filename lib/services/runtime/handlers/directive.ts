import { BaseNode } from '@voiceflow/base-types';
import { replaceVariables } from '@voiceflow/common';
import { HandlerFactory } from '@voiceflow/general-runtime/build/runtime';
import { Directive } from 'ask-sdk-model';
import _isString from 'lodash/isString';

import { T } from '@/lib/constants';

import { ResponseBuilder } from '../types';

export const DirectiveResponseBuilder: ResponseBuilder = (runtime, builder) => {
  const directives = runtime.turn.get(T.DIRECTIVES) as undefined | Directive[];
  if (directives) {
    directives.forEach((directive) => {
      builder.addDirective(directive);
    });
  }
};

const utilsObj = {
  replaceVariables,
};

export const DirectiveHandler: HandlerFactory<BaseNode.Directive.Node, typeof utilsObj> = (utils) => ({
  canHandle: (node) => {
    return _isString(node.directive);
  },
  handle: (node, runtime, variables) => {
    const { directive: unparsedDirective } = node;

    const directiveString = utils.replaceVariables(unparsedDirective, variables.getState());
    try {
      const directive = JSON.parse(directiveString) as Directive;
      runtime.turn.produce((draft) => {
        draft[T.DIRECTIVES] = [...(draft[T.DIRECTIVES] || []), directive];
      });
      runtime.trace.debug(`sending directive JSON:\n\`${directiveString}\``);
    } catch (err) {
      runtime.trace.debug(`invalid directive JSON:\n\`${directiveString}\`\n\`${err}\``);
    }

    return node.nextId;
  },
});

export default () => DirectiveHandler(utilsObj);
