import { config } from "dotenv";

config();

/**
 * Returns a console.log when in development mode.
 * @param toLog
 * @returns console.log
 */
export const printDev = (toLog: any) => {
  if (process.env.NODE_ENV === "development") {
    console.log(toLog);
  } else return;
};
