import { ChatInputCommandInteraction, GuildMember, PermissionFlagsBits } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("notify")
    .setDescription("Notify users of selected role via DM")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addRoleOption((option) => option.setName("role").setDescription("Role to notify").setRequired(true))
    .addStringOption((option) => option.setName("text").setDescription("Text to send").setRequired(true))
    .addBooleanOption((option) => option.setName("log").setDescription("Leave log in the channel")),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const role = interaction.options.getRole("role");
    const text = interaction.options.getString("text");
    const log = interaction.options.getBoolean("log");
    const sender = interaction.member;
    const guild = interaction.guild;

    const usersToWrite: Array<GuildMember> = [];
    const userSuccessArrays: Array<GuildMember> = [];
    const usersFailedArrays: Array<GuildMember> = [];

    if (!role || !role.id || !guild || !guild.name) return interaction.editReply("Error: Could not fetch the role.");

    try {
      interaction.guild?.members.cache.filter((member) => member.roles.cache.get(role.id)).forEach((user) => usersToWrite.push(user));
    } catch {
      console.log("Error fetching members");
      return interaction.editReply("Error: Could not fetch the role.");
    }

    try {
      if (text && role) {
        usersToWrite.forEach((user) => {
          try {
            // interaction.client.users.send(
            //   user.id,
            //   `${text}\n\nThis message was sent by ${sender} to the role ${role} from the server ${guild}.\nIn case you do not want to receive this message again, please contact ${sender}.`
            // );
            userSuccessArrays.push(user);
          } catch {
            usersFailedArrays.push(user);
          }
        });

        await interaction.editReply("Command complete.");
        await interaction.followUp({
          content: `Message sent was:\n${text}.\n\nThis message was sent by ${sender} to the role ${role} from the server ${guild}.\nIn case you do not want to receive this message again, please contact ${sender}.`,
          ephemeral: log ? false : true,
        });

        if (userSuccessArrays.length > 0) {
          await interaction.followUp({
            content: `Message was sent to ${userSuccessArrays.join(", ")}.`,
            ephemeral: log ? false : true,
          });
        }
        if (usersFailedArrays.length > 0) {
          await interaction.followUp({ content: `Failed to send message to ${usersFailedArrays.join(", ")}.`, ephemeral: log ? false : true });
        }
      }
    } catch (err) {
      console.log("/notify err: ", err);
      interaction.editReply(`There was an error using this function.`);
    }
  },
};
