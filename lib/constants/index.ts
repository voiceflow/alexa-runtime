// eslint-disable-next-line import/prefer-default-export
export { default as Flags, Turn as T, Storage as S, Frame as F, Variables as V } from './flags';

export const TEST_VERSION_ID = '__TEST__';

export enum Source {
  LOCAL = 'local',
  MONGO = 'mongo',
  DYNAMO = 'dynamo',
}
