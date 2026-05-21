import { SlashCommandBuilder } from "@discordjs/builders";
import { dzz, eq } from "db/client";
import { guild, log } from "db/schema";
import { ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits } from "discord.js";
import { printError } from "helpers/functions";

export const data = new SlashCommandBuilder()
  .setName("trackvoice-disable")
  .setDescription("Disable all channels voice tracking.")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  try {
    const guildId = interaction.guildId;

    if (guildId) {
      const existingTrack = await dzz.select().from(guild).where(eq(guild.guildId, guildId));

      if (existingTrack.length === 0) {
        await interaction.editReply(`There are no voice channels currently tracked.`);
        return;
      }

      await dzz.update(guild).set({ trackAll: false }).where(eq(guild.guildId, guildId));
      await interaction.editReply(`Voice channels are not longer being tracked.`);

      await dzz.insert(log).values({
        action: 304,
        guildId: guildId,
        guildName: interaction.guild?.name || null,
      });
    }
  } catch (err) {
    printError(true, "/trackvoicedisable err: ", err);
    try {
      await interaction.editReply("There was an error using this function.");
    } catch (replyError) {
      printError(true, "Failed to send error reply to interaction:", replyError);
    }
  }
}
