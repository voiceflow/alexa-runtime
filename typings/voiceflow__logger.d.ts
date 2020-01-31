declare module '@voiceflow/logger' {
  export default class Logger {
    constructor(config: Record<string, any>);

    trace(...args: any[]): void;

    debug(...args: any[]): void;

    info(...args: any[]): void;

    warn(...args: any[]): void;

    error(...args: any[]): void;

    fatal(...args: any[]): void;
  }
}
