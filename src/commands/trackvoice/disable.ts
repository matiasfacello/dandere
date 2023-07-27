import { SlashCommandBuilder } from "@discordjs/builders";
import { dzz, eq } from "db/client";
import { voiceTrack } from "db/schema";
import { ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("trackvoice-disable")
    .setDescription("Disable all channels voice tracking.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });
    try {
      const guildId = interaction.guildId;

      if (guildId) {
        const existingTrack = await dzz.select().from(voiceTrack).where(eq(voiceTrack.guildId, guildId));

        if (existingTrack.length === 0) {
          await interaction.editReply(`There are no voice channels currently tracked.`);
          return;
        }

        const trackDel = await dzz.delete(voiceTrack).where(eq(voiceTrack.guildId, guildId));

        if (trackDel.length === 0) {
          await interaction.editReply(`Voice channels are not longer being tracked.`);
        }
      }
    } catch (err) {
      console.log("/trackvoicedisable err: ", err);
      interaction.editReply("There was an error using this function.");
    }
  },
};
