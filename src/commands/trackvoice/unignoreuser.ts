import { ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { PrismaClient } from "@prisma/client";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("trackvoice-unignoreuser")
    .setDescription("Unignore user for all channels voice tracking.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addUserOption((option) => option.setName("user").setRequired(true).setDescription("User to track again")),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const user = interaction.options.getUser("user");
      const guildId = interaction.guildId;

      if (user && guildId) {
        const prisma = new PrismaClient();
        const get = await prisma.voiceTrack.findUnique({ where: { guildId: guildId } });

        if (!get) {
          await interaction.editReply(`There are no users currently ignored.`);
          return;
        }

        let ignoreArr: string[] = [];

        if (get && get.ignoreUsers) {
          if (!get.ignoreUsers.split(",").includes(user.id)) {
            await interaction.editReply(`User ${user} is not being tracked.`);
            return;
          }

          ignoreArr = get.ignoreUsers.split(",").filter((str) => str !== user.id);
        }

        const usersToIgnore = ignoreArr.length > 1 ? ignoreArr.join(",") : null;

        const create = await prisma.voiceTrack.update({
          where: {
            guildId: guildId,
          },
          data: {
            ignoreUsers: usersToIgnore,
          },
        });

        if (create) {
          await interaction.editReply(`User ${user} is not longer being tracked. `);
        }
      }
    } catch (err) {
      console.log("/trackvoice-unignoreuser err: ", err);
      interaction.editReply(`There was an error using this function.`);
    }
  },
};
