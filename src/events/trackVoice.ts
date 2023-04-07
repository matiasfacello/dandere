import { type TextChannel } from "discord.js";
import { printDev } from "../helpers/functions";
import { PrismaClient } from "@prisma/client";

/**
 * Event for tracking voice connections and disconnections.
 * Still needs some work to be done
 *
 * @param bot
 */
export const trackVoice = (bot: ClientType) => {
  const prisma = new PrismaClient();

  bot.on("voiceStateUpdate", async (oldState, newState) => {
    if (
      newState.channel &&
      oldState.channel &&
      (oldState.mute !== newState.mute || oldState.deaf !== newState.deaf || oldState.serverDeaf !== newState.serverDeaf || oldState.serverMute !== newState.serverMute)
    )
      return;

    const voiceTrack = await prisma.voiceTrack.findUnique({ where: { guildId: oldState.guild.id } });
    printDev(voiceTrack);
    if (!voiceTrack || !voiceTrack.logChannel || !voiceTrack.enabled) return;

    if (!voiceTrack.allChannels && voiceTrack.trackChannels && !voiceTrack.trackChannels.split(",").includes(oldState.channelId || newState.channelId || "")) return;

    const channelToWrite = (await bot.channels.fetch(voiceTrack.logChannel)) as TextChannel;

    if (newState.channel === null && oldState.channel) {
      const msg = `${oldState.channel}: ${oldState.member?.user} disconnected. `;
      channelToWrite.send(msg);
      printDev(msg);
    } else if (oldState.channel === null && newState.channel) {
      const msg = `${newState.channel}: ${newState.member?.user} connected.`;
      channelToWrite.send(msg);
      printDev(msg);
    } else if (newState.channel && oldState.channel && oldState.channelId !== newState.channelId) {
      const msg = `${oldState.channel} -> ${newState.channel}: ${newState.member?.user} moved.`;
      channelToWrite.send(msg);
      printDev(msg);
    }
  });
};
