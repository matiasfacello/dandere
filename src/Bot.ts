import { Client, GatewayIntentBits } from "discord.js";
import { config } from "dotenv";
import { sql } from "./db/client";
import { commandsCreate, commandsEvent, guildCreate, guildDelete, trackVoice } from "./events/index";
import { printDev, printError } from "./helpers/functions";
import { scheduleLogCleanup } from "./helpers/logCleanup";

config();

const REQUIRED_ENV_VARS = ["BOT_TOKEN", "APP_ID", "DATABASE_URL"];
for (const key of REQUIRED_ENV_VARS) {
  if (!process.env[key]) {
    printError(true, `Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const bot = new Client({
  intents: [GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
}) as ClientType;

bot.login(process.env.BOT_TOKEN).catch((err) => {
  printError(true, "Failed to login to Discord:", err);
  process.exit(1);
});

bot.on("clientReady", () => {
  printDev(`${bot.user?.tag} is ready!`);
});

const shutdown = async (signal: string) => {
  printDev(`Received ${signal}, shutting down...`);
  bot.destroy();
  await sql.end();
  process.exit(0);
};

process.on("SIGTERM", () => {
  shutdown("SIGTERM").catch((err) => {
    printError(true, "Error during shutdown:", err);
    process.exit(1);
  });
});
process.on("SIGINT", () => {
  shutdown("SIGINT").catch((err) => {
    printError(true, "Error during shutdown:", err);
    process.exit(1);
  });
});

commandsCreate(bot);
commandsEvent(bot);

guildCreate(bot);
guildDelete(bot);

trackVoice(bot);

scheduleLogCleanup();
