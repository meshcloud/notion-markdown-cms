import * as chalk from 'chalk';

const info = (...args: any[]): void => {
  console.log(chalk.cyan("info"), ...args);
};

const warn = (...args: any[]): void => {
  console.warn(chalk.yellow("warning"), ...args);
};

const error = (...args: any[]): void => {
  console.error(chalk.red("error"), ...args);
};

export const logger = {
  info,
  warn,
  error,
};


