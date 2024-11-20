import { SlashCommandBuilder } from "@discordjs/builders";
import { dzz, eq } from "db/client";
import { guild, log } from "db/schema";
import { ChatInputCommandInteraction, Client, PermissionFlagsBits, TextChannel } from "discord.js";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("trackvoice-ignoreuser")
    .setDescription("Ignore user for all channels voice tracking.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addUserOption((option) => option.setName("user").setRequired(true).setDescription("User to ignore")),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const user = interaction.options.getUser("user");
      const guildId = interaction.guildId;

      if (user && guildId) {
        const [get] = await dzz.select().from(guild).where(eq(guild.guildId, guildId));

        let ignoreArr: string[] = [];

        // Check if user is beign already tracked and push other ignores to the list
        if (get && get.ignoreUsers) {
          if (get.ignoreUsers.split(",").includes(user.id)) {
            await interaction.editReply(`User ${user} is already being ignored.`);
            return;
          }

          get.ignoreUsers.split(",").map((str: string) => {
            ignoreArr.push(str);
          });
        }

        // Add user to ignore list
        ignoreArr.push(user.id as string);

        const [update] = await dzz
          .update(guild)
          .set({ ignoreUsers: ignoreArr.join(",") })
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
      console.log("/trackvoice-ignoreuser err: ", err);
      interaction.editReply(`There was an error using this function.`);
    }
  },
};
