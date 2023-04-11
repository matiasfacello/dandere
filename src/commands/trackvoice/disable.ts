import { ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { PrismaClient } from "@prisma/client";

module.exports = {
  data: new SlashCommandBuilder().setName("trackvoice-disable").setDescription("Disable all channels voice tracking.").setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });
    try {
      const guildId = await interaction.guildId;

      if (guildId) {
        const prisma = new PrismaClient();
        const existingTrack = await prisma.voiceTrack.findFirst({ where: { guildId: guildId } });

        if (!existingTrack) {
          await interaction.editReply(`There are no voice channels currently tracked.`);
          return;
        }

        const trackDel = await prisma.voiceTrack.delete({
          where: {
            guildId: guildId,
          },
        });

        if (trackDel) {
          await interaction.editReply(`Voice channels are not longer being tracked.`);
        }
      }
    } catch (err) {
      console.log("/trackvoicedisable err: ", err);
      interaction.editReply("There was an error using this function.");
    }
  },
};
