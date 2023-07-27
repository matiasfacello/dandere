import { ChannelType, ChatInputCommandInteraction, PermissionFlagsBits, TextChannel } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { voiceTrack } from "db/schema";
import { dzz, eq } from "db/client";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("trackvoice-all")
    .setDescription("Starts tracking all the voice channels connections")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption((option) => option.setName("channel").setDescription("Channel to log connections to").addChannelTypes(ChannelType.GuildText).setRequired(true)),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });
    try {
      const channel = interaction.options.getChannel("channel");
      const guildId = interaction.guildId;

      if (channel && guildId) {
        const [upsert] = await dzz
          .insert(voiceTrack)
          .values({ guildId: guildId, enabled: true, allChannels: true, trackChannels: null, logChannel: channel.id })
          .onConflictDoUpdate({ target: voiceTrack.guildId, set: { enabled: true, allChannels: true, logChannel: channel.id }, where: eq(voiceTrack.guildId, guildId) })
          .returning();

        if (upsert && upsert.logChannel) {
          ((await interaction.client.channels.fetch(upsert.logChannel)) as TextChannel).send(`This channel has been selected to track all voice channels log.`);
          await interaction.editReply(`Channel <#${upsert.logChannel}> is now being used to track all voice channels. `);
        }
      }
    } catch (err) {
      console.log("/trackvoiceall err: ", err);
      interaction.editReply(`There was an error using this function.`);
    }
  },
};
