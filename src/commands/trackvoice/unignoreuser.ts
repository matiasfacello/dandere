import { SlashCommandBuilder } from "@discordjs/builders";
import { dzz, eq } from "db/client";
import { guild, log } from "db/schema";
import { ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits } from "discord.js";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("trackvoice-unignoreuser")
    .setDescription("Unignore user for all channels voice tracking.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addUserOption((option) => option.setName("user").setRequired(true).setDescription("User to unignore")),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const user = interaction.options.getUser("user");
      const guildId = interaction.guildId;

      if (user && guildId) {
        const [get] = await dzz.select().from(guild).where(eq(guild.guildId, guildId));

        // Check if no user is being ignored
        if (!get || !get.ignoreUsers) {
          await interaction.editReply(`There are no users currently ignored.`);
          return;
        }

        if (!get.ignoreUsers.includes(user.id)) {
          await interaction.editReply(`User ${user} is not being ignored.`);
          return;
        }

        const ignoreArr = get.ignoreUsers.filter((str) => str !== user.id);
        const usersToIgnore = ignoreArr.length > 0 ? ignoreArr : null;

        const [update] = await dzz.update(guild).set({ ignoreUsers: usersToIgnore }).where(eq(guild.guildId, guildId)).returning();

        if (update) {
          await interaction.editReply(`User ${user} is not being ignored anymore. `);
        }

        await dzz.insert(log).values({
          action: 212,
          guildId: guildId,
          guildName: interaction.guild?.name || null,
          userId: user.id,
          userName: user.username,
        });
      }
    } catch (err) {
      console.error("/trackvoice-unignoreuser err: ", err);
      try {
        await interaction.editReply(`There was an error using this function.`);
      } catch (replyError) {
        console.error("Failed to send error reply to interaction:", replyError);
      }
    }
  },
};
