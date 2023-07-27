import { SlashCommandBuilder } from "@discordjs/builders";
import { ChatInputCommandInteraction, PermissionFlagsBits, TextChannel } from "discord.js";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Deletes a specified amount of messages")
    .addIntegerOption((option) => {
      return option.setName("amount").setDescription("The amount of messages to delete.").setRequired(true).setMinValue(1).setMaxValue(100);
    })
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.memberPermissions?.has("ManageMessages"))
      return interaction.reply({
        content: "You do not have permissions to manage messages.",
        ephemeral: true,
      });
    if (!interaction.guild?.members.me?.permissions.has("ManageMessages"))
      return interaction.reply({
        content: "I do not have permissions to manage messages.",
        ephemeral: true,
      });

    const amount = interaction.options.getInteger("amount");

    if (amount && isNaN(amount)) {
      await interaction.reply({
        content: "Please insert a valid amount between 1 to 100.",
        ephemeral: true,
      });
    }

    if (amount && (amount > 100 || amount < 1)) {
      await interaction.reply({
        content: "Please insert a valid amount between 1 to 100.",
        ephemeral: true,
      });
    }

    try {
      const bulkDel = await (interaction.channel as TextChannel).bulkDelete(amount!);
      interaction.reply({
        content: `Deleted ${bulkDel.size} messages.`,
        ephemeral: true,
      });
    } catch (err) {
      console.log("Clear command err: ", err);
      interaction.reply({
        content: `There was an error deleting the messages.`,
        ephemeral: true,
      });
    }
  },
};
