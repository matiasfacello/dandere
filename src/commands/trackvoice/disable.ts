import { SlashCommandBuilder } from "@discordjs/builders";
import { dzz, eq } from "db/client";
import { channelTracking, guild, log } from "db/schema";
import { ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits } from "discord.js";
import { printError } from "helpers/functions";

export const data = new SlashCommandBuilder()
  .setName("trackvoice-disable")
  .setDescription("Stop tracking every voice channel (individually tracked ones stay on)")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  .addBooleanOption((option) =>
    option.setName("everything").setDescription("Also stop the individually tracked channels").setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  try {
    const guildId = interaction.guildId;

    if (guildId) {
      const existingTrack = await dzz.select().from(guild).where(eq(guild.guildId, guildId));

      if (existingTrack.length === 0) {
        await interaction.editReply(`This server has no voice tracking set up.`);
        return;
      }

      const everything = interaction.options.getBoolean("everything") ?? false;

      await dzz.update(guild).set({ trackAll: false }).where(eq(guild.guildId, guildId));
      if (everything) {
        await dzz.update(channelTracking).set({ enabled: false }).where(eq(channelTracking.guildId, guildId));
      }

      await interaction.editReply(
        everything
          ? `Voice tracking is off, including every individually tracked channel.`
          : `Stopped tracking every voice channel. Individually tracked channels are still logging — run this again with everything:True to stop those too.`
      );

      await dzz.insert(log).values({
        action: 304,
        guildId: guildId,
        guildName: interaction.guild?.name || null,
      });
    }
  } catch (err) {
    printError(true, "/trackvoicedisable err: ", err);
    try {
      await interaction.editReply("Something went wrong. Try again.");
    } catch (replyError) {
      printError(true, "Failed to send error reply to interaction:", replyError);
    }
  }
}
