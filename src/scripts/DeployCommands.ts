import { REST } from "discord.js";
import { config } from "dotenv";
import { deployCommands } from "helpers/commandDeployment";
import { loadCommands } from "helpers/commandLoader";
import { printError } from "helpers/functions";

config();

if (!process.env.BOT_TOKEN || !process.env.APP_ID) {
  printError(true, "Missing required environment variable: BOT_TOKEN or APP_ID");
  process.exit(1);
}

const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    const loaded = await loadCommands();
    if (loaded.hasErrors) {
      throw new Error("Commands could not be deployed because one or more command modules failed to load.");
    }
    await deployCommands(rest, process.env.APP_ID, loaded.commands.values());
  } catch (error) {
    printError(true, error);
  }
})();
