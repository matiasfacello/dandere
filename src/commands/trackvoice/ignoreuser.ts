import { ChatInputCommandInteraction, PermissionFlagsBits, TextChannel } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { PrismaClient } from "@prisma/client";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("trackvoice-ignoreuser")
    .setDescription("Ignore user for all channels voice tracking.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addUserOption((option) => option.setName("user").setRequired(true).setDescription("User to not track")),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const user = interaction.options.getUser("user");
      const guildId = interaction.guildId;

      if (user && guildId) {
        const prisma = new PrismaClient();
        const get = await prisma.voiceTrack.findUnique({ where: { guildId: guildId } });

        let ignoreArr: string[] = [];

        if (get && get.ignoreUsers) {
          if (get.ignoreUsers.split(",").includes(user.id)) {
            await interaction.editReply(`User ${user} is already being ignored.`);
            return;
          }

          get.ignoreUsers.split(",").map((str: string) => {
            ignoreArr.push(str);
          });
          ignoreArr.push(user.id as string);
        } else ignoreArr.push(user.id as string);

        const create = await prisma.voiceTrack.upsert({
          where: {
            guildId: guildId,
          },
          update: {
            enabled: true,
            allChannels: true,
            ignoreUsers: ignoreArr.join(","),
          },
          create: {
            guildId: guildId,
            enabled: true,
            allChannels: true,
            ignoreUsers: ignoreArr.join(","),
          },
        });

        if (create && create.ignoreUsers) {
          await interaction.editReply(`User <#${user}> is not longer tracked.`);
        }
      }
    } catch (err) {
      console.log("/trackvoice-ignoreuser err: ", err);
      interaction.editReply(`There was an error using this function.`);
    }
  },
};
