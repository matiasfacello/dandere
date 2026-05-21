declare global {
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    interface ProcessEnv {
      BOT_TOKEN: string;
      APP_ID: string;
      NODE_ENV: "development" | "production";
      DATABASE_URL: string;
      RATE_LIMIT_CLEANUP_HOURS?: string;
      RATE_LIMIT_CLEANUP_HOUR?: string;
    }
  }
}

export {};
