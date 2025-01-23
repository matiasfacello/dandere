import { SlashCommandBuilder } from "@discordjs/builders";
import { dzz, eq } from "db/client";
import { guild, log } from "db/schema";
import { ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits } from "discord.js";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("trackvoice-disable")
    .setDescription("Disable all channels voice tracking.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    try {
      const guildId = interaction.guildId;

      if (guildId) {
        const existingTrack = await dzz.select().from(guild).where(eq(guild.guildId, guildId));

        if (existingTrack.length === 0) {
          await interaction.editReply(`There are no voice channels currently tracked.`);
          return;
        }

        const [trackUpdate] = await dzz.update(guild).set({ trackAll: false }).where(eq(guild.guildId, guildId)).returning();

        if (!trackUpdate.trackAll) {
          await interaction.editReply(`Voice channels are not longer being tracked.`);
        }

        await dzz.insert(log).values({
          action: 304,
          guildId: guildId,
          guildName: interaction.guild?.name || null,
        });
      }
    } catch (err) {
      console.log("/trackvoicedisable err: ", err);
      interaction.editReply("There was an error using this function.");
    }
  },
};
