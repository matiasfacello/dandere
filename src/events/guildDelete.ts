import { dzz } from "db/client";
import { log } from "db/schema";

/**
 * Event for when bot lefts a guild
 *
 * @param bot
 */
export const guildDelete = (bot: ClientType) => {
  bot.on("guildDelete", async (guild) => {
    try {
      const [createLog] = await dzz.insert(log).values({
        action: 202,
        guildId: guild.id,
        guildName: guild.name,
      });

      console.log(`Left a guild: ${guild.name} <${guild.id}>`);
    } catch (err) {
      console.log("Left a guild err: ", err);
    }
  });
};
