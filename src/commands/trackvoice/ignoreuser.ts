import { SlashCommandBuilder } from "@discordjs/builders";
import { addIgnoredUser } from "db/ignoreUsers";
import { dzz } from "db/client";
import { log } from "db/schema";
import { ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits } from "discord.js";
import { printError } from "helpers/functions";

export const data = new SlashCommandBuilder()
  .setName("trackvoice-ignoreuser")
  .setDescription("Ignore user for all channels voice tracking.")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  .addUserOption((option) => option.setName("user").setRequired(true).setDescription("User to ignore"));

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    const user = interaction.options.getUser("user");
    const guildId = interaction.guildId;

    if (user && guildId) {
      if (!/^\d{17,20}$/.test(user.id)) {
        await interaction.editReply("Invalid user ID format.");
        return;
      }

      const result = await addIgnoredUser(guildId, user.id);

      if (result === "already_ignored") {
        await interaction.editReply(`User ${user} is already being ignored.`);
        return;
      }

      if (result === "not_found") {
        await interaction.editReply("Guild not found in the database.");
        return;
      }

      await interaction.editReply(`User ${user} is now being ignored.`);

      await dzz.insert(log).values({
        action: 211,
        guildId: guildId,
        guildName: interaction.guild?.name || null,
        userId: user.id,
        userName: user.username,
      });
    }
  } catch (err) {
    printError(true, "/trackvoice-ignoreuser err: ", err);
    try {
      await interaction.editReply(`There was an error using this function.`);
    } catch (replyError) {
      printError(true, "Failed to send error reply to interaction:", replyError);
    }
  }
}
