import { expect } from 'chai';
import sinon from 'sinon';

import { T } from '@/lib/constants';
import CardHandler, { addVariables, CardHandlerGenerator, CardResponseBuilder, CardType } from '@/lib/services/voiceflow/handlers/card';

describe('card handler unit tests', async () => {
  afterEach(() => sinon.restore());

  describe('canHandle', () => {
    it('false', async () => {
      const block = {};

      const result = CardHandler.canHandle(block as any, null as any, null as any, null as any);

      expect(result).to.eql(false);
    });

    it('true', async () => {
      const block = { card: { foo: 'bar' } };

      const result = CardHandler.canHandle(block as any, null as any, null as any, null as any);

      expect(result).to.eql(true);
    });
  });

  describe('handle', () => {
    it('no card type', async () => {
      const utils = {
        addVariables: sinon
          .stub()
          .onFirstCall()
          .returns('TITLE')
          .onSecondCall()
          .returns('TEXT')
          .onThirdCall()
          .returns('CONTENT'),
      };

      const cardHandler = CardHandlerGenerator(utils);

      const block = {
        card: {
          title: 'title',
          text: 'text',
          content: 'content',
        },
        nextId: 'next-id',
      };
      const context = {
        turn: { set: sinon.stub() },
      };
      const variables = { foo: 'bar' };

      const result = cardHandler.handle(block as any, context as any, variables as any, null as any);

      expect(result).to.eql(block.nextId);
      expect(utils.addVariables.args[0]).to.eql([block.card.title, variables]);
      expect(utils.addVariables.args[1]).to.eql([block.card.text, variables]);
      expect(utils.addVariables.args[2]).to.eql([block.card.content, variables]);
      expect(context.turn.set.args[0]).to.eql([
        T.CARD,
        {
          type: CardType.SIMPLE,
          title: 'TITLE',
          text: 'TEXT',
          content: 'CONTENT',
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

      const cardHandler = CardHandlerGenerator(utils);

      const block = {
        card: {
          type: 'random-type',
        },
      };
      const context = {
        turn: { set: sinon.stub() },
      };
      const variables = { foo: 'bar' };

      cardHandler.handle(block as any, context as any, variables as any, null as any);

      expect(context.turn.set.args[0][1].type).to.eql(block.card.type);
    });

    it('type STANDARD but no image', async () => {
      const utils = {
        addVariables: sinon.stub().returns(''),
      };

      const cardHandler = CardHandlerGenerator(utils);

      const block = {
        card: {
          type: CardType.STANDARD,
        },
      };
      const context = {
        turn: { set: sinon.stub() },
      };
      const variables = { foo: 'bar' };

      cardHandler.handle(block as any, context as any, variables as any, null as any);

      expect(context.turn.set.args[0][1].image).to.eql({ largeImageUrl: '', smallImageUrl: '' });
    });

    it('type STANDARD with image', async () => {
      const utils = {
        addVariables: sinon.stub().returns('url'),
      };

      const cardHandler = CardHandlerGenerator(utils);

      const block = {
        card: {
          type: CardType.STANDARD,
          image: {
            largeImageUrl: 'random-url',
            smallImageUrl: 'small-random-url',
          },
        },
      };
      const context = {
        turn: { set: sinon.stub() },
      };
      const variables = { foo: 'bar' };

      cardHandler.handle(block as any, context as any, variables as any, null as any);

      expect(utils.addVariables.args[3]).to.eql([block.card.image.largeImageUrl, variables]);
      expect(context.turn.set.args[0][1].image).to.eql({ largeImageUrl: 'url', smallImageUrl: 'url' });
    });
  });

  describe('responseBuilder', () => {
    it('no card', async () => {
      const context = {
        turn: { get: sinon.stub().returns(null) },
      };

      CardResponseBuilder(context as any, null as any);

      expect(context.turn.get.args[0]).to.eql([T.CARD]);
    });

    it('unknow card type', async () => {
      const card = {
        type: 'random',
      };

      const context = {
        turn: { get: sinon.stub().returns(card) },
      };

      CardResponseBuilder(context as any, null as any);

      expect(context.turn.get.args[0]).to.eql([T.CARD]);
    });

    it('simple card', async () => {
      const card = {
        type: CardType.SIMPLE,
        title: 'TITLE',
        content: 'CONTENT',
      };

      const context = {
        turn: { get: sinon.stub().returns(card) },
      };

      const builder = { withSimpleCard: sinon.stub() };

      CardResponseBuilder(context as any, builder as any);

      expect(context.turn.get.args[0]).to.eql([T.CARD]);
      expect(builder.withSimpleCard.args).to.eql([[card.title, card.content]]);
    });

    it('standard card', async () => {
      const card = {
        type: CardType.STANDARD,
        title: 'TITLE',
        text: 'TEXT',
        image: {
          largeImageUrl: 'IMAGE URL',
          smallImageUrl: 'SMALL IMAGE URL',
        },
      };

      const context = {
        turn: { get: sinon.stub().returns(card) },
      };

      const builder = { withStandardCard: sinon.stub() };

      CardResponseBuilder(context as any, builder as any);

      expect(context.turn.get.args[0]).to.eql([T.CARD]);
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
      const regexVariables = sinon.stub().returns(actual);
      const varState = { foo: 'bar' };
      const variables = { getState: sinon.stub().returns(varState) };

      const result = addVariables(regexVariables as any)(value, variables as any, null as any);
      expect(result).to.eql(actual);
      expect(regexVariables.args[0]).to.eql([value, varState]);
    });
  });
});
