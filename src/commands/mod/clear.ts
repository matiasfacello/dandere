import { SlashCommandBuilder } from "@discordjs/builders";
import { ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits, TextChannel } from "discord.js";
import { printError } from "helpers/functions";

export const data = new SlashCommandBuilder()
  .setName("clear")
  .setDescription("Deletes a specified amount of messages")
  .addIntegerOption((option) => {
    return option.setName("amount").setDescription("The amount of messages to delete.").setRequired(true).setMinValue(1).setMaxValue(100);
  })
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.memberPermissions?.has("ManageMessages"))
    return interaction.reply({
      content: "You do not have permissions to manage messages.",
      flags: MessageFlags.Ephemeral,
    });
  if (!interaction.guild?.members.me?.permissions.has("ManageMessages"))
    return interaction.reply({
      content: "I do not have permissions to manage messages.",
      flags: MessageFlags.Ephemeral,
    });

  const amount = interaction.options.getInteger("amount");

  if (amount && (amount > 100 || amount < 1)) {
    await interaction.reply({
      content: "Please insert a valid amount between 1 to 100.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  try {
    const bulkDel = await (interaction.channel as TextChannel).bulkDelete(amount!);
    interaction.reply({
      content: `Deleted ${bulkDel.size} messages.`,
      flags: MessageFlags.Ephemeral,
    });
  } catch (err) {
    printError(false, "Clear command err: ", err);
    try {
      await interaction.reply({
        content: `There was an error deleting the messages.`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (replyError) {
      printError(false, "Failed to send error reply to interaction:", replyError);
    }
  }
}
