import { SlashCommandBuilder } from "@discordjs/builders";
import { dzz, eq } from "db/client";
import { channelTracking, guild, log } from "db/schema";
import { ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits } from "discord.js";
import { printError } from "helpers/functions";

export const data = new SlashCommandBuilder()
  .setName("trackvoice-disable")
  .setDescription("Disable all-channels voice tracking. Per-channel tracking stays on unless you set everything.")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  .addBooleanOption((option) =>
    option.setName("everything").setDescription("Also switch off every individually tracked channel").setRequired(false)
  );

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

      const everything = interaction.options.getBoolean("everything") ?? false;

      await dzz.update(guild).set({ trackAll: false }).where(eq(guild.guildId, guildId));
      if (everything) {
        await dzz.update(channelTracking).set({ enabled: false }).where(eq(channelTracking.guildId, guildId));
      }

      await interaction.editReply(
        everything
          ? `Voice tracking is off. Every individually tracked channel was switched off too.`
          : `All-channels tracking is off. Individually tracked channels are still being logged — run this again with everything:True to silence them.`
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
      await interaction.editReply("There was an error using this function.");
    } catch (replyError) {
      printError(true, "Failed to send error reply to interaction:", replyError);
    }
  }
}
