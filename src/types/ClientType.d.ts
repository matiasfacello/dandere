import { type ChatInputCommandInteraction, type Client, type Collection } from "discord.js";
import { type SlashCommandBuilder } from "@discordjs/builders";

export type Command = {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface ClientType extends Client {
    commands: Collection<string, Command>;
  }
}
