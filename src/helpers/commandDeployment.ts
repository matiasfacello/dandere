import { readFile, writeFile } from "node:fs/promises";
import * as path from "node:path";
import { REST, Routes } from "discord.js";
import { createCommandHash } from "helpers/commandHash";
import { printDev, printError } from "helpers/functions";
import { type Command } from "types/ClientType";

// ponytail: hash lives in the container's writable layer, so it survives crash-loop
// restarts but not an image redeploy — that costs one extra deploy, not the 200/day
// budget. Move it to a one-column table if the bot ever runs somewhere more ephemeral.
const COMMAND_HASH_PATH = path.join(process.cwd(), ".application-commands.hash");
type SerializedCommand = ReturnType<Command["data"]["toJSON"]>;

export function serializeCommands(commands: Iterable<Command>): SerializedCommand[] {
  return [...commands].map((command) => command.data.toJSON());
}

async function readDeployedHash(): Promise<string | null> {
  try {
    return (await readFile(COMMAND_HASH_PATH, "utf8")).trim();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      printError(true, "Failed to read the deployed command hash:", error);
    }
    return null;
  }
}

async function deploy(rest: REST, applicationId: string, commands: SerializedCommand[]): Promise<void> {
  printDev(`Started refreshing ${commands.length} application (/) commands.`);

  const data = (await rest.put(Routes.applicationCommands(applicationId), { body: commands })) as unknown[];

  await writeFile(COMMAND_HASH_PATH, createCommandHash(commands), "utf8");
  printDev(`Successfully reloaded ${data.length} application (/) commands.`);
}

export async function deployCommands(rest: REST, applicationId: string, commands: Iterable<Command>): Promise<void> {
  await deploy(rest, applicationId, serializeCommands(commands));
}

export async function deployCommandsIfChanged(rest: REST, applicationId: string, commands: Iterable<Command>): Promise<boolean> {
  const serializedCommands = serializeCommands(commands);
  const localHash = createCommandHash(serializedCommands);

  if ((await readDeployedHash()) === localHash) {
    printDev("Application (/) commands are unchanged; skipping deployment.");
    return false;
  }

  await deploy(rest, applicationId, serializedCommands);
  return true;
}
