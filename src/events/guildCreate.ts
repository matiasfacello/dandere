import { dzz } from "db/client";
import { guild as guildSchema, log } from "db/schema";

/**
 * Event for when bot joins a guild
 *
 * @param bot
 */
export const guildCreate = (bot: ClientType) => {
  bot.on("guildCreate", async (guild) => {
    try {
      const [guildInsert] = await dzz
        .insert(guildSchema)
        .values({
          guildId: guild.id,
          trackAll: true,
        })
        .onConflictDoNothing({
          target: guildSchema.guildId,
        });

      const [createLog] = await dzz.insert(log).values({
        action: 201,
        guildId: guild.id,
        guildName: guild.name,
      });

      console.log(`Join a guild: ${guild.name} <${guild.id}>`);
    } catch (err) {
      console.log("Join a guild err: ", err);
    }
  });
};
