import { SlashCommandBuilder } from "@discordjs/builders";
import { sql } from "db/client";
import { ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits } from "discord.js";
import { printError } from "helpers/functions";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("status")
    .setDescription("Shows bot and database status")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    try {
      let dbStatus = "Connected";
      try {
        await sql`SELECT 1`;
      } catch {
        dbStatus = "Unreachable";
      }

      const ping = interaction.client.ws.ping;

      await interaction.editReply(`**Bot Status**\nBot: Online\nPing: ${ping}ms\nDatabase: ${dbStatus}`);
    } catch (err) {
      printError(false, "/status err: ", err);
      try {
        await interaction.editReply(`There was an error fetching status.`);
      } catch (replyError) {
        printError(false, "Failed to send error reply to interaction:", replyError);
      }
    }
  },
};
