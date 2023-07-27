import { dzz, eq } from "db/client";
import { voiceTrack } from "db/schema";
import { type TextChannel } from "discord.js";
import { printDev } from "../helpers/functions";

/**
 * Event for tracking voice connections and disconnections.
 * Still needs some work to be done
 *
 * @param bot
 */
export const trackVoice = (bot: ClientType) => {
  bot.on("voiceStateUpdate", async (oldState, newState) => {
    if (
      newState.channel &&
      oldState.channel &&
      (oldState.mute !== newState.mute ||
        oldState.deaf !== newState.deaf ||
        oldState.serverDeaf !== newState.serverDeaf ||
        oldState.serverMute !== newState.serverMute)
    )
      return;

    const [getVoiceTrack] = await dzz.select().from(voiceTrack).where(eq(voiceTrack.guildId, oldState.guild.id));
    printDev(getVoiceTrack);
    if (!getVoiceTrack || !getVoiceTrack.logChannel || !getVoiceTrack.enabled) return;
    if (getVoiceTrack.ignoreUsers?.includes(oldState.member?.id || newState.member?.id || "")) return;
    if (
      !getVoiceTrack.allChannels &&
      getVoiceTrack.trackChannels &&
      !getVoiceTrack.trackChannels.split(",").includes(oldState.channelId || newState.channelId || "")
    )
      return;

    const channelToWrite = (await bot.channels.fetch(getVoiceTrack.logChannel)) as TextChannel;

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
