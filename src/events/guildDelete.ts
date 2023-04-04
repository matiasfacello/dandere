import { PrismaClient } from "@prisma/client";

/**
 * Event for when bot lefts a guild
 *
 * @param bot
 */
export const guildDelete = (bot: ClientType) => {
  const prisma = new PrismaClient();
  bot.on("guildDelete", async (guild) => {
    const guildId = guild.id;
    try {
      const voiceTrack = await prisma.voiceTrack.findUnique({ where: { guildId: guildId } });
      if (voiceTrack) await prisma.voiceTrack.delete({ where: { guildId: guildId } });
      console.log(`Left a guild: ${guild.name} <${guild.id}>`);
    } catch (err) {
      console.log("Left a guild err: ", err);
    }
  });
};
