import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("[Fatal] Missing required environment variable: DATABASE_URL");
  process.exit(1);
}

const sql = postgres(connectionString, { max: 10 });
const dzz = drizzle({ client: sql });

export { dzz, eq, sql };
