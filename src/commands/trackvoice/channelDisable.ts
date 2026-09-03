import { SlashCommandBuilder } from "@discordjs/builders";
import { and } from "drizzle-orm";
import { dzz, eq } from "db/client";
import { channelTracking, log } from "db/schema";
import { ChannelType, ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits } from "discord.js";
import { printError } from "helpers/functions";

export const data = new SlashCommandBuilder()
  .setName("trackvoice-channel-disable")
  .setDescription("Stop tracking one voice channel")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  .addChannelOption((option) =>
    option.setName("voice-channel").setDescription("Voice channel to stop tracking").addChannelTypes(ChannelType.GuildVoice).setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  try {
    const voiceChannel = interaction.options.getChannel("voice-channel");
    const guildId = interaction.guildId;

    if (voiceChannel && guildId) {
      const existingTrack = await dzz
        .select()
        .from(channelTracking)
        .where(and(eq(channelTracking.guildId, guildId), eq(channelTracking.channelId, voiceChannel.id)));

      if (existingTrack.length === 0 || !existingTrack[0].enabled) {
        await interaction.editReply(`${voiceChannel} is not being tracked.`);
        return;
      }

      await dzz
        .update(channelTracking)
        .set({ enabled: false })
        .where(and(eq(channelTracking.guildId, guildId), eq(channelTracking.channelId, voiceChannel.id)));
      await interaction.editReply(`Stopped tracking ${voiceChannel}.`);

      await dzz.insert(log).values({
        action: 302,
        guildId: guildId,
        guildName: interaction.guild?.name || null,
        channelId: voiceChannel.id,
        channelName: voiceChannel.name,
      });
    }
  } catch (err) {
    printError(true, "/trackvoice-channel-disable err: ", err);
    try {
      await interaction.editReply("Something went wrong. Try again.");
    } catch (replyError) {
      printError(true, "Failed to send error reply to interaction:", replyError);
    }
  }
}
