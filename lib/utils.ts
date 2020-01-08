import { ValidationChain } from 'express-validator';
import { Middleware } from 'express-validator/src/base';

type Validations = Record<string, ValidationChain>;

type ClassType<A extends any[] = any[], I = any> = { new (...args: A): I };

const METHODS_KEY = Symbol('methods-key');

export const validate = (validations: Validations): any => (_target: object, _key: string, descriptor: PropertyDescriptor) => {
  descriptor.value = Object.assign(descriptor.value, { validations });

  return descriptor;
};

export const factory = (): any => (_target: () => Middleware, _key: string, descriptor: PropertyDescriptor) => {
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

export const getMethods = (obj: any) => obj?.[METHODS_KEY] || [];
