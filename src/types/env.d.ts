declare global {
  namespace NodeJS {
    interface ProcessEnv {
      BOT_TOKEN: string;
      APP_ID: string;
      NODE_ENV: "development" | "production";
      DZZ_HOST?: string;
      DZZ_PORT?: number;
      DZZ_USER?: string;
      DZZ_PASSWORD?: string;
      DZZ_DATABASE?: string;
      DATABASE_URL: string;
      RATE_LIMIT_CLEANUP_HOURS?: string;
      RATE_LIMIT_CLEANUP_HOUR?: string;
    }
  }
}

export {};
