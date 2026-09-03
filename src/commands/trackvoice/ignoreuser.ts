import { SlashCommandBuilder } from "@discordjs/builders";
import { addIgnoredUser } from "db/ignoreUsers";
import { dzz } from "db/client";
import { log } from "db/schema";
import { ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits } from "discord.js";
import { printError } from "helpers/functions";

export const data = new SlashCommandBuilder()
  .setName("trackvoice-ignoreuser")
  .setDescription("Stop logging voice activity for one user")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  .addUserOption((option) => option.setName("user").setRequired(true).setDescription("User to stop logging"));

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    const user = interaction.options.getUser("user");
    const guildId = interaction.guildId;

    if (user && guildId) {
      if (!/^\d{17,20}$/.test(user.id)) {
        await interaction.editReply("That is not a valid user.");
        return;
      }

      const result = await addIgnoredUser(guildId, user.id);

      if (result === "already_ignored") {
        await interaction.editReply(`${user} is already being ignored.`);
        return;
      }

      if (result === "not_found") {
        await interaction.editReply("This server has no voice tracking set up yet.");
        return;
      }

      await interaction.editReply(`Now ignoring ${user}.`);

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
      await interaction.editReply(`Something went wrong. Try again.`);
    } catch (replyError) {
      printError(true, "Failed to send error reply to interaction:", replyError);
    }
  }
}
