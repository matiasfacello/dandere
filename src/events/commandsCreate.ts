import * as fs from "fs";
import * as path from "path";
import { pathToFileURL } from "url";
import { Collection } from "discord.js";
import { printWarn, printError } from "../helpers/functions";

export const commandsCreate = async (bot: ClientType) => {
  bot.commands = new Collection();

  const foldersPath = path.join(__dirname, "..", "commands");
  const commandFolders = fs.readdirSync(foldersPath);

  for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    // tsx is the only supported runtime — no compiled .js output exists
    const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".ts"));
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      try {
        const command = await import(pathToFileURL(filePath).href);
        if ("data" in command && "execute" in command) {
          bot.commands.set(command.data.name, command);
        } else {
          printWarn(false, `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
      } catch (err) {
        printError(true, `[ERROR] Failed to load command at ${filePath}:`, err);
      }
    }
  }
};
