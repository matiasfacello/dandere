import * as fs from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import { Collection } from "discord.js";
import { printError, printWarn } from "helpers/functions";
import { type Command } from "types/ClientType";

export type LoadedCommands = {
  commands: Collection<string, Command>;
  hasErrors: boolean;
};

export async function loadCommands(): Promise<LoadedCommands> {
  const commands = new Collection<string, Command>();
  let hasErrors = false;
  const foldersPath = path.join(__dirname, "..", "commands");
  const commandFolders = fs.readdirSync(foldersPath);

  for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    // tsx is the only supported runtime — no compiled .js output exists
    const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".ts"));
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      try {
        const command = (await import(pathToFileURL(filePath).href)) as Partial<Command>;
        if (command.data && command.execute) {
          commands.set(command.data.name, command as Command);
        } else {
          hasErrors = true;
          printWarn(false, `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
      } catch (err) {
        hasErrors = true;
        printError(true, `[ERROR] Failed to load command at ${filePath}:`, err);
      }
    }
  }

  return { commands, hasErrors };
}
