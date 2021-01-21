import { Node } from '@voiceflow/alexa-types/build/nodes/directive';
import { HandlerFactory, replaceVariables } from '@voiceflow/runtime';
import { Directive } from 'ask-sdk-model';
import _isString from 'lodash/isString';

import { StaticPostgresDB } from '@/lib/clients/postgres';
import { T } from '@/lib/constants';
import log from '@/logger';

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

type SQLDirective = {
  query: string;
  params: any[];
};
const isSQLDirective = (directive?: any): directive is SQLDirective => {
  return directive?.query && Array.isArray(directive?.params);
};

export const DirectiveHandler: HandlerFactory<Node, typeof utilsObj> = (utils) => ({
  canHandle: (node) => {
    return _isString(node.directive);
  },
  handle: async (node, runtime, variables) => {
    const { directive: unparsedDirective } = node;

    const directiveString = utils.replaceVariables(unparsedDirective, variables.getState());
    try {
      const directive = JSON.parse(directiveString) as Directive;
      // check if this is a special custom SQL directive
      if (isSQLDirective(directive)) {
        // apply it to the database
        await StaticPostgresDB.client.query(directive.query, directive.params).catch((error) => {
          log.warn(`Custom SQL Fail ${JSON.stringify(directive)}`);
          log.error(error);
        });
      } else {
        runtime.turn.produce((draft) => {
          draft[T.DIRECTIVES] = [...(draft[T.DIRECTIVES] || []), directive];
        });
        runtime.trace.debug(`sending directive JSON:\n\`${directiveString}\``);
      }
    } catch (err) {
      runtime.trace.debug(`invalid directive JSON:\n\`${directiveString}\`\n\`${err}\``);
    }

    return node.nextId;
  },
});

export default () => DirectiveHandler(utilsObj);
