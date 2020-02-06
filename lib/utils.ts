// @ts-nocheck

import { ResponseBuilder } from '@voiceflow/backend-utils';
import { ValidationChain } from 'express-validator';
import { Middleware } from 'express-validator/src/base';

type Validations = Record<string, ValidationChain>;

type ClassType<A extends any[] = any[], I = any> = { new (...args: A): I };

const METHODS_KEY = Symbol('methods-key');

export const validate = (validations: Validations): any => (_target: object, _key: string, descriptor: PropertyDescriptor) => {
  descriptor.value = Object.assign(descriptor.value, { validations });

  return descriptor;
};

export const factory = () => (_target: () => Middleware, _key: string, descriptor: PropertyDescriptor) => {
  descriptor.value = Object.assign(descriptor.value, { callback: true });

  return descriptor;
};

export const router = <T extends ClassType>(clazz: T): void => {
  clazz[METHODS_KEY] = Object.getOwnPropertyNames(clazz.prototype).reduce((acc, key) => {
    const value = clazz.prototype[key];

    if (key !== 'constructor' && typeof value === 'function') {
      acc.push(key);
    }

    return acc;
  }, []);
};

export const getInstanceMethodNames = (obj) => {
  const proto = Object.getPrototypeOf(obj);
  if (proto.constructor.name === 'Object') {
    // obj is instance of class
    return Object.getOwnPropertyNames(obj);
  }

  // obj is class
  return Object.getOwnPropertyNames(proto).filter((name) => name !== 'constructor');
};

const responseBuilder = new ResponseBuilder();

export const routeWrapper = (routers) => {
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
