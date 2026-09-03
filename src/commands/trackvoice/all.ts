import { SlashCommandBuilder } from "@discordjs/builders";
import { dzz, eq } from "db/client";
import { guild, log } from "db/schema";
import { ChannelType, ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits, TextChannel } from "discord.js";
import { printError } from "helpers/functions";

export const data = new SlashCommandBuilder()
  .setName("trackvoice-all")
  .setDescription("Track voice activity in every voice channel")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  .addChannelOption((option) =>
    option.setName("channel").setDescription("Text channel to post the logs in").addChannelTypes(ChannelType.GuildText).setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  try {
    const channel = interaction.options.getChannel("channel");
    const guildId = interaction.guildId;

    if (channel && guildId) {
      await dzz
        .insert(guild)
        .values({
          guildId: guildId,
          logChannelId: channel.id,
          trackAll: true,
        })
        .onConflictDoUpdate({
          target: guild.guildId,
          set: { trackAll: true, logChannelId: channel.id },
          where: eq(guild.guildId, guildId),
        });

      try {
        const logChannel = (await interaction.client.channels.fetch(channel.id)) as TextChannel;
        await logChannel.send(`Voice activity in every voice channel will be logged here.`);
      } catch (err) {
        printError(true, `Failed to send message to log channel ${channel.id}:`, err);
      }

      await interaction.editReply(`Now tracking every voice channel. Logs will go to <#${channel.id}>.`);

      await dzz.insert(log).values({
        action: 303,
        guildId: guildId,
        guildName: interaction.guild?.name || null,
      });
    }
  } catch (err) {
    printError(true, "/trackvoiceall err: ", err);
    try {
      await interaction.editReply(`Something went wrong. Try again.`);
    } catch (replyError) {
      printError(true, "Failed to send error reply to interaction:", replyError);
    }
  }
}
