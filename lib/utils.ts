import { ResponseBuilder } from '@voiceflow/backend-utils';
import { ValidationChain } from 'express-validator';
import { Middleware } from 'express-validator/src/base';
import _ from 'lodash';

import { ControllerMap } from './controllers';
import { AbstractController } from './controllers/utils';
import { MiddlewareMap } from './middlewares';
import { AbstractMiddleware } from './middlewares/utils';

type Validations = Record<string, ValidationChain>;

export const validate = (validations: Validations) => (_target: object, _key: string, descriptor: PropertyDescriptor) => {
  descriptor.value = Object.assign(descriptor.value, { validations });

  return descriptor;
};

export const factory = () => (_target: () => Middleware, _key: string, descriptor: PropertyDescriptor) => {
  descriptor.value = Object.assign(descriptor.value, { callback: true });

  return descriptor;
};

export const getInstanceMethodNames = (obj: AbstractMiddleware | AbstractController) => {
  const proto = Object.getPrototypeOf(obj);
  if (proto.constructor.name === 'Object') {
    return Object.getOwnPropertyNames(obj);
  }

  return Object.getOwnPropertyNames(proto).filter((name) => name !== 'constructor');
};

const responseBuilder = new ResponseBuilder();

export const routeWrapper = (routers: ControllerMap | MiddlewareMap) => {
  Object.values(routers).forEach((routes) => {
    getInstanceMethodNames(routes).forEach((route) => {
      if (typeof routes[route] === 'function' && !routes[route].route) {
        const routeHandler = routes[route].bind(routes);
        routeHandler.validations = routes[route].validations;
        routeHandler.callback = routes[route].callback;

        routes[route] = responseBuilder.route(routeHandler);
      }
    });
  });
};

/*
  Recursively apply _.filter to collection, returning all results in array.
  item refers to the actual object, path refers to the path that the object is located at
*/

export const deepFind = <T = any>(collection: any, predicate: any) => {
  let results: { item: T; path: string[] }[] = [];

  const find = (subCollection: any, path: string[]) => {
    if (!_.isObject(subCollection)) {
      return;
    }

    // resolve TS type
    const _subCollection = subCollection as Record<string, any>;

    const matches = _.filter(_subCollection, predicate);

    if (matches) {
      results = results.concat(matches.map((item) => ({ item, path })));
    }

    Object.keys(_subCollection).forEach((key) => find(_subCollection[key], path.concat([key])));
  };

  find(collection, []);

  return results;
};
