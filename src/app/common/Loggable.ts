import type { BaseLogger, Bindings, ChildLoggerOptions } from 'pino';

export interface Logger extends BaseLogger {
  child(bindings: Bindings, options?: ChildLoggerOptions): Logger;
}

export interface ILoggableDeps {
  log: Logger;
}
export class Loggable {
  protected readonly log: Logger;
  constructor(
    readonly name: string,
    readonly filename: string,
    { log }: ILoggableDeps,
  ) {
    this.log = log.child({ file: filename, name });
  }
}
