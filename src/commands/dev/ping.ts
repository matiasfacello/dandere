import { ChatInputCommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";

console.log("Ping imported");

// Create a slash command builder
module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!")
    .addStringOption((option) => option.setName("input").setDescription("The input to echo back").setRequired(true)),
  async execute(interaction: ChatInputCommandInteraction) {
    const input = interaction.options.getString("input") ?? "No input provided";
    console.log(input);
    await interaction.reply({ content: `Secret Pong! Your input: ${input}`, ephemeral: true });
  },
};
