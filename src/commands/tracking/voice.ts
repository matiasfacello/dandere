import { ChannelType, ChatInputCommandInteraction, PermissionFlagsBits, TextChannel } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { PrismaClient } from "@prisma/client";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("trackvoiceall")
    .setDescription("Starts tracking all the voice channels connections")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption((option) => option.setName("channel").setDescription("Channel to log connections to").addChannelTypes(ChannelType.GuildText).setRequired(true)),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });
    try {
      const channel = await interaction.options.getChannel("channel");
      const guildId = await interaction.guildId;

      if (channel && guildId) {
        const prisma = new PrismaClient();
        const create = await prisma.voiceTrack.upsert({
          where: {
            guildId: guildId,
          },
          update: {
            enabled: true,
            allChannels: true,
            logChannel: channel.id,
          },
          create: {
            guildId: guildId,
            enabled: true,
            allChannels: true,
            logChannel: channel.id,
          },
        });

        if (create && create.logChannel) {
          ((await interaction.client.channels.fetch(create.logChannel)) as TextChannel).send(`This channel has been selected to track all voice channels log.`);
          await interaction.editReply(`Channel <#${create.logChannel}> is now being used to track all voice channels. `);
        }
      }
    } catch (err) {
      console.log("/trackvoiceall err: ", err);
      interaction.editReply(`There was an error using this function.`);
    }
  },
};
