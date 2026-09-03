import { SlashCommandBuilder } from "@discordjs/builders";
import { and } from "drizzle-orm";
import { dzz, eq } from "db/client";
import { channelTracking, guild, log } from "db/schema";
import { ChannelType, ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits, TextChannel } from "discord.js";
import { printError } from "helpers/functions";

export const data = new SlashCommandBuilder()
  .setName("trackvoice-channel")
  .setDescription("Track voice activity in one voice channel")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  .addChannelOption((option) =>
    option.setName("voice-channel").setDescription("Voice channel to track").addChannelTypes(ChannelType.GuildVoice).setRequired(true)
  )
  .addChannelOption((option) =>
    option.setName("log-channel").setDescription("Text channel to post the logs in").addChannelTypes(ChannelType.GuildText).setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  try {
    const voiceChannel = interaction.options.getChannel("voice-channel");
    const logChannel = interaction.options.getChannel("log-channel");
    const guildId = interaction.guildId;

    if (voiceChannel && logChannel && guildId) {
      await dzz
        .insert(guild)
        .values({
          guildId: guildId,
          logChannelId: logChannel.id,
        })
        .onConflictDoUpdate({
          target: guild.guildId,
          set: { logChannelId: logChannel.id },
          where: eq(guild.guildId, guildId),
        });

      await dzz
        .insert(channelTracking)
        .values({
          guildId: guildId,
          channelId: voiceChannel.id,
          enabled: true,
        })
        .onConflictDoUpdate({
          target: [channelTracking.guildId, channelTracking.channelId],
          set: { enabled: true },
          where: and(eq(channelTracking.guildId, guildId), eq(channelTracking.channelId, voiceChannel.id)),
        });

      try {
        const channel = (await interaction.client.channels.fetch(logChannel.id)) as TextChannel;
        await channel.send(`Voice activity in ${voiceChannel} will be logged here.`);
      } catch (err) {
        printError(true, `Failed to send message to log channel ${logChannel.id}:`, err);
      }

      await interaction.editReply(`Now tracking ${voiceChannel}. Logs will go to <#${logChannel.id}>.`);

      await dzz.insert(log).values({
        action: 301,
        guildId: guildId,
        guildName: interaction.guild?.name || null,
        channelId: voiceChannel.id,
        channelName: voiceChannel.name,
      });
    }
  } catch (err) {
    printError(true, "/trackvoice-channel err: ", err);
    try {
      await interaction.editReply(`Something went wrong. Try again.`);
    } catch (replyError) {
      printError(true, "Failed to send error reply to interaction:", replyError);
    }
  }
}
