import { SlashCommandBuilder } from "@discordjs/builders";
import { removeIgnoredUser } from "db/ignoreUsers";
import { dzz } from "db/client";
import { log } from "db/schema";
import { ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits } from "discord.js";
import { printError } from "helpers/functions";

export const data = new SlashCommandBuilder()
  .setName("trackvoice-unignoreuser")
  .setDescription("Start logging voice activity for one user again")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  .addUserOption((option) => option.setName("user").setRequired(true).setDescription("User to start logging again"));

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    const user = interaction.options.getUser("user");
    const guildId = interaction.guildId;

    if (user && guildId) {
      const result = await removeIgnoredUser(guildId, user.id);

      if (result === "no_users") {
        await interaction.editReply("No users are being ignored.");
        return;
      }

      if (result === "not_ignored") {
        await interaction.editReply(`${user} is not being ignored.`);
        return;
      }

      await interaction.editReply(`No longer ignoring ${user}.`);

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
      await interaction.editReply(`Something went wrong. Try again.`);
    } catch (replyError) {
      printError(true, "Failed to send error reply to interaction:", replyError);
    }
  }
}
