import { SlashCommandBuilder } from "@discordjs/builders";
import { dzz, eq } from "db/client";
import { guild, log } from "db/schema";
import { ChatInputCommandInteraction, Client, MessageFlags, PermissionFlagsBits, TextChannel } from "discord.js";
import { printError } from "helpers/functions";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("trackvoice-ignoreuser")
    .setDescription("Ignore user for all channels voice tracking.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addUserOption((option) => option.setName("user").setRequired(true).setDescription("User to ignore")),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const user = interaction.options.getUser("user");
      const guildId = interaction.guildId;

      if (user && guildId) {
        if (!/^\d{17,20}$/.test(user.id)) {
          await interaction.editReply("Invalid user ID format.");
          return;
        }

        const [get] = await dzz.select().from(guild).where(eq(guild.guildId, guildId));

        let ignoreArr: string[] = [];

        if (get && get.ignoreUsers) {
          if (get.ignoreUsers.includes(user.id)) {
            await interaction.editReply(`User ${user} is already being ignored.`);
            return;
          }

          ignoreArr = [...get.ignoreUsers];
        }

        ignoreArr.push(user.id);

        const [update] = await dzz
          .update(guild)
          .set({ ignoreUsers: ignoreArr })
          .where(eq(guild.guildId, guildId))
          .returning();

        if (update) {
          await interaction.editReply(`User ${user} is now being ignored.`);
        }

        await dzz.insert(log).values({
          action: 211,
          guildId: guildId,
          guildName: interaction.guild?.name || null,
          userId: user.id,
          userName: user.username,
        });
      }
    } catch (err) {
      printError(false,"/trackvoice-ignoreuser err: ", err);
      try {
        await interaction.editReply(`There was an error using this function.`);
      } catch (replyError) {
        printError(false,"Failed to send error reply to interaction:", replyError);
      }
    }
  },
};
