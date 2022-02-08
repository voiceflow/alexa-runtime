import { BaseNode } from '@voiceflow/base-types';
import { expect } from 'chai';
import sinon from 'sinon';

import { T } from '@/lib/constants';
import { addVariables, CardHandler, CardResponseBuilder } from '@/lib/services/runtime/handlers/card';

describe('card handler unit tests', async () => {
  afterEach(() => sinon.restore());

  describe('canHandle', () => {
    it('false', async () => {
      const node = {};

      const result = CardHandler(null as any).canHandle(node as any, null as any, null as any, null as any);

      expect(result).to.eql(false);
    });

    it('true', async () => {
      const node = { card: { foo: 'bar' } };

      const result = CardHandler(null as any).canHandle(node as any, null as any, null as any, null as any);

      expect(result).to.eql(true);
    });
  });

  describe('handle', () => {
    it('no card type', async () => {
      const utils = {
        addVariables: sinon
          .stub()
          .onFirstCall()
          .returns('CONTENT')
          .onSecondCall()
          .returns('TITLE'),
      };

      const cardHandler = CardHandler(utils);

      const node = {
        card: {
          title: 'title',
          text: 'text',
          content: 'content',
        },
        nextId: 'next-id',
      };
      const runtime = {
        turn: { set: sinon.stub() },
      };
      const variables = { foo: 'bar' };

      const result = cardHandler.handle(node as any, runtime as any, variables as any, null as any);

      expect(result).to.eql(node.nextId);
      expect(utils.addVariables.args[0]).to.eql([node.card.content, variables]);
      expect(utils.addVariables.args[1]).to.eql([node.card.title, variables]);
      expect(runtime.turn.set.args[0]).to.eql([
        T.CARD,
        {
          type: BaseNode.Card.CardType.SIMPLE,
          title: 'TITLE',
          text: 'CONTENT',
          image: {
            largeImageUrl: '',
            smallImageUrl: '',
          },
        },
      ]);
    });

    it('has card type', async () => {
      const utils = {
        addVariables: sinon.stub().returns(''),
      };

      const cardHandler = CardHandler(utils);

      const node = {
        card: {
          type: 'random-type',
        },
      };
      const runtime = {
        turn: { set: sinon.stub() },
      };
      const variables = { foo: 'bar' };

      cardHandler.handle(node as any, runtime as any, variables as any, null as any);

      expect(runtime.turn.set.args[0][1].type).to.eql(node.card.type);
    });

    it('type STANDARD but no image', async () => {
      const utils = {
        addVariables: sinon.stub().returns(''),
      };

      const cardHandler = CardHandler(utils);

      const node = {
        card: {
          type: BaseNode.Card.CardType.STANDARD,
        },
      };
      const runtime = {
        turn: { set: sinon.stub() },
      };
      const variables = { foo: 'bar' };

      cardHandler.handle(node as any, runtime as any, variables as any, null as any);

      expect(runtime.turn.set.args[0][1].image).to.eql({ largeImageUrl: '', smallImageUrl: '' });
    });

    it('type STANDARD with image', async () => {
      const utils = {
        addVariables: sinon.stub().returns('url'),
      };

      const cardHandler = CardHandler(utils);

      const node = {
        card: {
          type: BaseNode.Card.CardType.STANDARD,
          image: {
            largeImageUrl: 'random-url',
            smallImageUrl: 'small-random-url',
          },
        },
      };
      const runtime = {
        turn: { set: sinon.stub() },
      };
      const variables = { foo: 'bar' };

      cardHandler.handle(node as any, runtime as any, variables as any, null as any);

      expect(utils.addVariables.args[2]).to.eql([node.card.image.largeImageUrl, variables]);
      expect(runtime.turn.set.args[0][1].image).to.eql({ largeImageUrl: 'url', smallImageUrl: 'url' });
    });
  });

  describe('responseBuilder', () => {
    it('no card', async () => {
      const runtime = {
        turn: { get: sinon.stub().returns(null) },
      };

      CardResponseBuilder(runtime as any, null as any);

      expect(runtime.turn.get.args[0]).to.eql([T.CARD]);
    });

    it('unknow card type', async () => {
      const card = {
        type: 'random',
      };

      const runtime = {
        turn: { get: sinon.stub().returns(card) },
      };

      CardResponseBuilder(runtime as any, null as any);

      expect(runtime.turn.get.args[0]).to.eql([T.CARD]);
    });

    it('simple card', async () => {
      const card = {
        type: BaseNode.Card.CardType.SIMPLE,
        title: 'TITLE',
        texr: 'CONTENT',
      };

      const runtime = {
        turn: { get: sinon.stub().returns(card) },
      };

      const builder = { withSimpleCard: sinon.stub() };

      CardResponseBuilder(runtime as any, builder as any);

      expect(runtime.turn.get.args[0]).to.eql([T.CARD]);
      expect(builder.withSimpleCard.args).to.eql([[card.title, card.content]]);
    });

    it('standard card', async () => {
      const card = {
        type: BaseNode.Card.CardType.STANDARD,
        title: 'TITLE',
        text: 'TEXT',
        image: {
          largeImageUrl: 'IMAGE URL',
          smallImageUrl: 'SMALL IMAGE URL',
        },
      };

      const runtime = {
        turn: { get: sinon.stub().returns(card) },
      };

      const builder = { withStandardCard: sinon.stub() };

      CardResponseBuilder(runtime as any, builder as any);

      expect(runtime.turn.get.args[0]).to.eql([T.CARD]);
      expect(builder.withStandardCard.args).to.eql([[card.title, card.text, card.image.smallImageUrl, card.image.largeImageUrl]]);
    });
  });

  describe('addVariables', () => {
    it('no value', async () => {
      const defaultValue = 'default';

      const result = addVariables(null as any)(null as any, null as any, defaultValue);
      expect(result).to.eql(defaultValue);
    });

    it('no value and no default', async () => {
      const result = addVariables(null as any)(null as any, null as any);
      expect(result).to.eql('');
    });

    it('has value', () => {
      const value = 'value';
      const actual = 'random';
      const replaceVariables = sinon.stub().returns(actual);
      const varState = { foo: 'bar' };
      const variables = { getState: sinon.stub().returns(varState) };

      const result = addVariables(replaceVariables as any)(value, variables as any, null as any);
      expect(result).to.eql(actual);
      expect(replaceVariables.args[0]).to.eql([value, varState]);
    });
  });
});
