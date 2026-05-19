import * as fs from "fs";
import * as path from "path";
import { Collection } from "discord.js";

/**
 * Create commands for the bot
 *
 * @param bot
 */
export const commandsCreate = (bot: ClientType) => {
  bot.commands = new Collection();

  const foldersPath = path.join(__dirname, "..", "commands");
  const commandFolders = fs.readdirSync(foldersPath);

  for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".ts"));
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const command = require(filePath);
        if ("data" in command && "execute" in command) {
          bot.commands.set(command.data.name, command);
        } else {
          console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
      } catch (err) {
        console.error(`[ERROR] Failed to load command at ${filePath}:`, err);
      }
    }
  }
};
