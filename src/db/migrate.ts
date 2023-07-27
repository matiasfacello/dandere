import { dzz } from "db/client";
import { migrate } from "drizzle-orm/postgres-js/migrator";

const migration = async () => await migrate(dzz, { migrationsFolder: "drizzle" });

migration();
