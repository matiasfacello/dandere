import { loadCommands } from "helpers/commandLoader";

export const commandsCreate = async (bot: ClientType) => {
  const loaded = await loadCommands();
  bot.commands = loaded.commands;
  return loaded.hasErrors;
};
