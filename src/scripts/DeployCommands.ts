import * as fs from "fs";
import * as path from "path";
import { pathToFileURL } from "url";
import { REST, Routes } from "discord.js";
import { config } from "dotenv";
import { printDev, printError } from "../helpers/functions";

config();

if (!process.env.BOT_TOKEN || !process.env.APP_ID) {
  printError(true, "Missing required environment variable: BOT_TOKEN or APP_ID");
  process.exit(1);
}

const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);

(async () => {
  const commands = [];
  const foldersPath = path.join(__dirname, "..", "commands");
  const commandFolders = fs.readdirSync(foldersPath);

  for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".ts"));
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = await import(pathToFileURL(filePath).href);
      commands.push(command.data.toJSON());
    }
  }

  try {
    printDev(`Started refreshing ${commands.length} application (/) commands.`);

    const data = (await rest.put(Routes.applicationCommands(process.env.APP_ID), { body: commands })) as unknown[];

    printDev(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    printError(true, error);
  }
})();
