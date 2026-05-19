import { dzz } from "db/client";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { printError } from "../helpers/functions";

const migration = async () => await migrate(dzz, { migrationsFolder: "drizzle" });

migration()
  .then(() => process.exit(0))
  .catch((err) => {
    printError(true, "Migration failed:", err);
    process.exit(1);
  });
