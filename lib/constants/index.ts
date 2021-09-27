export { Frame as F, default as Flags, Storage as S, Turn as T, Variables as V } from './flags';

export enum Source {
  LOCAL = 'local',
  MONGO = 'mongo',
  DYNAMO = 'dynamo',
  POSTGRES = 'postgres',
}
