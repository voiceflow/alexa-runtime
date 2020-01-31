declare module '@voiceflow/common' {
  namespace utils.general {
    // eslint-disable-next-line import/prefer-default-export
    export function generateHash(arr: string[]): string;
    export function getProcessEnv(variable: string): string;
    export function hasProcessEnv(variable: string): boolean;
  }
}
