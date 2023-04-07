import { ChannelType, ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { PrismaClient } from "@prisma/client";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("trackvoicedisable")
    .setDescription("Disables tracking for a specific voice channels")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption((option) => option.setName("voicechannel").setDescription("Channel to not track connections to anymore").addChannelTypes(ChannelType.GuildVoice).setRequired(true)),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const voicechannel = await interaction.options.getChannel("voicechannel");
      const guildId = await interaction.guildId;

      if (voicechannel && guildId) {
        const prisma = new PrismaClient();
        const get = await prisma.voiceTrack.findUnique({ where: { guildId: guildId } });

        if (!get) {
          await interaction.editReply(`There are no voice channels currently tracked.`);
          return;
        }

        let trackArr: string[] = [];

        if (get && get.trackChannels) {
          if (!get.trackChannels.split(",").includes(voicechannel.id)) {
            await interaction.editReply(`Channel ${voicechannel} is not being tracked.`);
            return;
          }

          trackArr = get.trackChannels.split(",").filter((str) => str !== voicechannel.id);
        }

        if (trackArr.length === 0) {
          const trackDel = await prisma.voiceTrack.delete({
            where: {
              guildId: guildId,
            },
          });

          await interaction.editReply(`Channel ${voicechannel} is not longer being tracked. `);
          return;
        }

        const create = await prisma.voiceTrack.update({
          where: {
            guildId: guildId,
          },
          data: {
            enabled: true,
            allChannels: false,
            trackChannels: trackArr.join(","),
            logChannel: get.logChannel,
          },
        });

        if (create && create.logChannel) {
          await interaction.editReply(`Channel ${voicechannel} is not longer being tracked. `);
        }
      }
    } catch (err) {
      console.log("/trackvoiceall err: ", err);
      interaction.editReply(`There was an error using this function.`);
    }
  },
};
