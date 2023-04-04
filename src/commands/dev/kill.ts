import { ChatInputCommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";

module.exports = {
  data: new SlashCommandBuilder().setName("kill").setDescription("Please don't."),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });
    const botId = await interaction.client.application?.fetch();

    if (interaction.user.id !== interaction.client.application.owner?.id) return interaction.editReply("You have no power here.");
    try {
      if (await interaction.editReply("Was I a good bot?")) {
        interaction.client.destroy();
      }
    } catch (err) {
      console.log("/kill err: ", err);
      interaction.editReply("There was an error using this function.");
    }
  },
};
