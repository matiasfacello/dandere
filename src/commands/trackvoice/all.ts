import { SlashCommandBuilder } from "@discordjs/builders";
import { dzz, eq } from "db/client";
import { guild, log } from "db/schema";
import { ChannelType, ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits, TextChannel } from "discord.js";
import { printError } from "helpers/functions";

export const data = new SlashCommandBuilder()
  .setName("trackvoice-all")
  .setDescription("Starts tracking all the voice channels connections")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  .addChannelOption((option) =>
    option.setName("channel").setDescription("Channel to log connections to").addChannelTypes(ChannelType.GuildText).setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  try {
    const channel = interaction.options.getChannel("channel");
    const guildId = interaction.guildId;

    if (channel && guildId) {
      const [upsert] = await dzz
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
        })
        .returning();

      if (upsert && upsert.logChannelId) {
        try {
          const logChannel = (await interaction.client.channels.fetch(upsert.logChannelId)) as TextChannel;
          await logChannel.send(`This channel has been selected to track all voice channels log.`);
        } catch (err) {
          printError(false, `Failed to send message to log channel ${upsert.logChannelId}:`, err);
        }
        await interaction.editReply(`Channel <#${upsert.logChannelId}> is now being used to track all voice channels. `);
      }

      await dzz.insert(log).values({
        action: 303,
        guildId: guildId,
        guildName: interaction.guild?.name || null,
      });
    }
  } catch (err) {
    printError(false, "/trackvoiceall err: ", err);
    try {
      await interaction.editReply(`There was an error using this function.`);
    } catch (replyError) {
      printError(false, "Failed to send error reply to interaction:", replyError);
    }
  }
}
