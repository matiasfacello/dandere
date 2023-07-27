import { migrate } from "drizzle-orm/postgres-js/migrator";
import { dzz } from "db/client";

const migration = async () => await migrate(dzz, { migrationsFolder: "drizzle" });

migration();
