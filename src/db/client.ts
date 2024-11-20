import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

config();

const connectionString = process.env.DATABASE_URL;
const ssl = process.env.NODE_ENV === "production" ? true : false;

const sql = postgres(connectionString, { max: 1, ssl });
const dzz = drizzle({ client: sql });

export { dzz, eq };
