import { ResponseBuilder } from '@voiceflow/backend-utils';
import { ValidationChain } from 'express-validator';
import { Middleware } from 'express-validator/src/base';

type Validations = Record<string, ValidationChain>;

export const validate = (validations: Validations) => (_target: object, _key: string, descriptor: PropertyDescriptor) => {
  descriptor.value = Object.assign(descriptor.value, { validations });

  return descriptor;
};

export const factory = () => (_target: () => Middleware, _key: string, descriptor: PropertyDescriptor) => {
  descriptor.value = Object.assign(descriptor.value, { callback: true });

  return descriptor;
};

const responseBuilder = new ResponseBuilder();

export const router = <T>(members: (keyof T)[] = []) => <C extends Function>(constructor: C) => {
  members.forEach((name) => {
    constructor.prototype[name] = responseBuilder.route(constructor.prototype[name].bind(constructor.prototype));
  });

  return constructor;
};
