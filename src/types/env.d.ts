declare global {
  namespace NodeJS {
    interface ProcessEnv {
      BOT_TOKEN: string;
      APP_ID: string;
      NODE_ENV: "development" | "production";
      DATABASE_URL: string;
    }
  }
}

export {};
