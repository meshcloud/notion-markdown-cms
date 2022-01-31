import * as chalk from 'chalk';
import { performance } from 'perf_hooks';

const info = (...args: any[]): void => {
  console.log(chalk.cyan("info"), ...args);
};

const tip = (...args: any[]): void => {
  console.log(chalk.blue("tip"), ...args);
};

const success = (...args: any[]): void => {
  console.log(chalk.green("success"), ...args);
};

const warn = (...args: any[]): void => {
  console.warn(chalk.yellow("warning"), ...args);
};

const error = (...args: any[]): void => {
  console.error(chalk.red("error"), ...args);
};

export const logger = {
  info,
  tip,
  success,
  warn,
  error,
};

export class RenderingLoggingContext {
  private readonly start = performance.now();

  constructor(
    public readonly notionUrl: string,
    public readonly file?: string
  ) {}

  info(message: string) {
    return logger.info(this.garnish(message));
  }

  warn(message: string) {
    return logger.warn(this.garnish(message));
  }

  error(err: unknown) {
    return logger.error(this.garnish(err as any)); // bah
  }

  complete() {
    const elapsed = performance.now() - this.start;
    this.info("rendered page in " + Math.round(elapsed) + "ms");
  }

  private garnish(message: string) {
    return `${message} ${chalk.gray(this.file || this.notionUrl)}`;
  }
}
