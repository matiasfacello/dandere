import { dzz, eq } from "db/client";
import { voiceTrack } from "db/schema";

/**
 * Event for when bot lefts a guild
 *
 * @param bot
 */
export const guildDelete = (bot: ClientType) => {
  bot.on("guildDelete", async (guild) => {
    const guildId = guild.id;
    try {
      const [getVoiceTrack] = await dzz.select().from(voiceTrack).where(eq(voiceTrack.guildId, guildId));
      if (getVoiceTrack.guildId) await dzz.delete(voiceTrack).where(eq(voiceTrack.guildId, guildId));
      console.log(`Left a guild: ${guild.name} <${guild.id}>`);
    } catch (err) {
      console.log("Left a guild err: ", err);
    }
  });
};
