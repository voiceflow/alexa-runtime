/* eslint-disable import/prefer-default-export */
import { isConstructor } from '@/lib/utils';
import { Config } from '@/types';

import { FullServiceMap } from '.';

type InjectedServiceMap<S extends object> = { [K in keyof S]: { new (services: FullServiceMap, config: Config): S[K] } };

const constructService = (Service: any, services: any, config: any) => {
  // eslint-disable-next-line no-nested-ternary
  return isConstructor(Service) ? new Service(services, config) : typeof Service === 'function' ? Service(services, config) : Service;
};

export const injectServices = <S extends object>(injectedServiceMap: InjectedServiceMap<S> | S) => <T extends { new (...args: any[]): any }>(
  clazz: T
): any =>
  class extends clazz {
    constructor(...args: any[]) {
      super(...args);
      const keys = Object.keys(injectedServiceMap) as (keyof typeof injectedServiceMap)[];
      const injectedServices = keys
        .filter((key) => !(key in this.services))
        .reduce((acc, key) => {
          const Service = injectedServiceMap[key];
          acc[key] = constructService(Service, this.services, this.config);
          return acc;
        }, {} as S);
      this.services = { ...this.services, ...injectedServices };
    }
  };
