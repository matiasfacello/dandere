import { config } from "dotenv";

config();

const isDev = process.env.NODE_ENV !== "production";

export const printDev = (...args: unknown[]) => {
  if (isDev) {
    console.log(...args);
  }
};

export const printWarn = (force: boolean, ...args: unknown[]) => {
  if (force || isDev) {
    console.warn(...args);
  }
};

export const printError = (force: boolean, ...args: unknown[]) => {
  if (force || isDev) {
    console.error(...args);
  }
};
