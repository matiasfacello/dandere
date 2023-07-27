import { ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { dzz, eq } from "db/client";
import { voiceTrack } from "db/schema";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("trackvoice-unignoreuser")
    .setDescription("Unignore user for all channels voice tracking.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addUserOption((option) => option.setName("user").setRequired(true).setDescription("User to unignore")),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const user = interaction.options.getUser("user");
      const guildId = interaction.guildId;

      if (user && guildId) {
        const [get] = await dzz.select().from(voiceTrack).where(eq(voiceTrack.guildId, guildId));

        // Check if no user is being ignored
        if (!get || !get.ignoreUsers) {
          await interaction.editReply(`There are no users currently ignored.`);
          return;
        }

        let ignoreArr: string[] = [];

        // Check if user is beign ignored make new list of ignored users
        if (get && get.ignoreUsers) {
          if (!get.ignoreUsers.split(",").includes(user.id)) {
            await interaction.editReply(`User ${user} is not being ignored.`);
            return;
          }

          ignoreArr = get.ignoreUsers.split(",").filter((str) => str !== user.id);
        }

        const usersToIgnore = ignoreArr.length > 0 ? ignoreArr.join(",") : null;

        const [update] = await dzz
          .update(voiceTrack)
          .set({ ignoreUsers: ignoreArr.join(",") })
          .where(eq(voiceTrack.guildId, guildId))
          .returning();

        if (update) {
          await interaction.editReply(`User ${user} is not being ignored anymore. `);
        }
      }
    } catch (err) {
      console.log("/trackvoice-unignoreuser err: ", err);
      interaction.editReply(`There was an error using this function.`);
    }
  },
};
