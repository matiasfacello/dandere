import { ChannelType, ChatInputCommandInteraction, PermissionFlagsBits, TextChannel } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { PrismaClient } from "@prisma/client";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("trackvoice")
    .setDescription("Starts tracking a specific voice channels connections")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption((option) => option.setName("voicechannel").setDescription("Channel to track connections to").addChannelTypes(ChannelType.GuildVoice).setRequired(true))
    .addChannelOption((option) => option.setName("logchannel").setDescription("Channel to log connections to").addChannelTypes(ChannelType.GuildText).setRequired(true)),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });
    try {
      const voicechannel = await interaction.options.getChannel("voicechannel");
      const logchannel = await interaction.options.getChannel("logchannel");
      const guildId = await interaction.guildId;

      if (voicechannel && logchannel && guildId) {
        const prisma = new PrismaClient();
        const get = await prisma.voiceTrack.findUnique({ where: { guildId: guildId } });

        let trackArr: string[] = [];

        if (get && get.trackChannels) {
          if (get.trackChannels.split(",").includes(voicechannel.id)) {
            await interaction.editReply(`Channel ${voicechannel} is already being tracked.`);
            return;
          }

          get.trackChannels.split(",").map((str: string) => {
            trackArr.push(str);
          });
          trackArr.push(voicechannel.id as string);
        } else trackArr.push(voicechannel.id as string);

        const create = await prisma.voiceTrack.upsert({
          where: {
            guildId: guildId,
          },
          update: {
            enabled: true,
            allChannels: false,
            trackChannels: trackArr.join(","),
            logChannel: logchannel.id,
          },
          create: {
            guildId: guildId,
            enabled: true,
            allChannels: false,
            trackChannels: trackArr.join(","),
            logChannel: logchannel.id,
          },
        });

        if (create && create.logChannel) {
          ((await interaction.client.channels.fetch(create.logChannel)) as TextChannel).send(`This channel has been selected to track selected voice channels log.`);
          await interaction.editReply(`Channel <#${create.logChannel}> is now being used to track selected voice channels. `);
        }
      }
    } catch (err) {
      console.log("/trackvoiceall err: ", err);
      interaction.editReply(`There was an error using this function.`);
    }
  },
};
