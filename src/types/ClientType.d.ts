import { type ChatInputCommandInteraction, type Client, type Collection } from "discord.js";
import { type SlashCommandBuilder } from "@discordjs/builders";

export interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

declare global {
  interface ClientType extends Client {
    commands: Collection<string, Command>;
  }
}
