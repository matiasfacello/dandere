import { SlashCommandBuilder } from "@discordjs/builders";
import { dzz, eq } from "db/client";
import { voiceTrack } from "db/schema";
import { ChatInputCommandInteraction, PermissionFlagsBits, TextChannel } from "discord.js";

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
        const [get] = await dzz.select().from(voiceTrack).where(eq(voiceTrack.guildId, guildId));

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

        const [upsert] = await dzz
          .insert(voiceTrack)
          .values({ guildId: guildId, ignoreUsers: ignoreArr.join(",") })
          .onConflictDoUpdate({
            target: voiceTrack.guildId,
            set: { ignoreUsers: ignoreArr.join(",") },
            where: eq(voiceTrack.guildId, guildId),
          })
          .returning();

        if (upsert && upsert.ignoreUsers) {
          await interaction.editReply(`User ${user} is now being ignored.`);
        }
      }
    } catch (err) {
      console.log("/trackvoice-ignoreuser err: ", err);
      interaction.editReply(`There was an error using this function.`);
    }
  },
};
