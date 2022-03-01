import * as chalk from "chalk";
import { performance } from "perf_hooks";
import { logger } from "./logger";


export class RenderingContextLogger {
  private readonly start = performance.now();

  constructor(
    public readonly notionUrl: string,
    public readonly file?: string
  ) { }

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
