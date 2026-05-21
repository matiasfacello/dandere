import { dzz } from "db/client";
import { guild as guildSchema, log } from "db/schema";
import { printDev, printError } from "../helpers/functions";

/**
 * Event for when bot joins a guild
 *
 * @param bot
 */
export const guildCreate = (bot: ClientType) => {
  bot.on("guildCreate", async (guild) => {
    try {
      await dzz
        .insert(guildSchema)
        .values({
          guildId: guild.id,
          trackAll: true,
        })
        .onConflictDoNothing({
          target: guildSchema.guildId,
        });

      await dzz.insert(log).values({
        action: 201,
        guildId: guild.id,
        guildName: guild.name,
      });

      printDev(`Join a guild: ${guild.name} <${guild.id}>`);
    } catch (err) {
      printError(false, "Join a guild err: ", err);
    }
  });
};
