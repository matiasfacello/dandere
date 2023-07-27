import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";

import { config } from "dotenv";
config();

const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString, { max: 1 });
const dzz = drizzle(sql);

export { dzz, eq };
