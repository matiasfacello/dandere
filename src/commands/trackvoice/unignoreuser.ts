import { SlashCommandBuilder } from "@discordjs/builders";
import { removeIgnoredUser } from "db/ignoreUsers";
import { dzz } from "db/client";
import { log } from "db/schema";
import { ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits } from "discord.js";
import { printError } from "helpers/functions";

export const data = new SlashCommandBuilder()
  .setName("trackvoice-unignoreuser")
  .setDescription("Unignore user for all channels voice tracking.")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  .addUserOption((option) => option.setName("user").setRequired(true).setDescription("User to unignore"));

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    const user = interaction.options.getUser("user");
    const guildId = interaction.guildId;

    if (user && guildId) {
      const result = await removeIgnoredUser(guildId, user.id);

      if (result === "no_users") {
        await interaction.editReply("There are no users currently ignored.");
        return;
      }

      if (result === "not_ignored") {
        await interaction.editReply(`User ${user} is not being ignored.`);
        return;
      }

      await interaction.editReply(`User ${user} is not being ignored anymore.`);

      await dzz.insert(log).values({
        action: 212,
        guildId: guildId,
        guildName: interaction.guild?.name || null,
        userId: user.id,
        userName: user.username,
      });
    }
  } catch (err) {
    printError(true, "/trackvoice-unignoreuser err: ", err);
    try {
      await interaction.editReply(`There was an error using this function.`);
    } catch (replyError) {
      printError(true, "Failed to send error reply to interaction:", replyError);
    }
  }
}
