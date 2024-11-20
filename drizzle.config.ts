import { config } from "dotenv";
import type { Config } from "drizzle-kit";

config();

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    host: process.env.DZZ_HOST,
    port: process.env.DZZ_PORT,
    user: process.env.DZZ_USER,
    password: process.env.DZZ_PASSWORD,
    database: process.env.DZZ_DATABASE,
    ssl: process.env.NODE_ENV === "production" ? true : false,
  },
} satisfies Config;
