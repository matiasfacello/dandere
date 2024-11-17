import { dzz, eq } from "db/client";
import { log, voiceTrack } from "db/schema";
import { VoiceState, type TextChannel } from "discord.js";
import { printDev } from "../helpers/functions";

/**
 * Event for tracking voice connections and disconnections.
 * Still needs some work to be done
 *
 * @param bot
 */
export const trackVoice = (bot: ClientType) => {
  bot.on("voiceStateUpdate", async (oldState, newState) => {
    // Validate if the state change is worth tracking
    if (!validateTracking(oldState, newState)) return;

    // Validate if the server is tracked
    const [getVoiceTrack] = await dzz.select().from(voiceTrack).where(eq(voiceTrack.guildId, oldState.guild.id));
    printDev(getVoiceTrack);

    if (!getVoiceTrack || !getVoiceTrack.logChannel || !getVoiceTrack.enabled) return;

    if (getVoiceTrack.ignoreUsers?.includes(oldState.member?.id || newState.member?.id || "")) return;

    if (!getVoiceTrack.allChannels) return;
    if (getVoiceTrack.trackChannels && !getVoiceTrack.trackChannels.split(",").includes(oldState.channelId || newState.channelId || "")) return;

    // Action needs to be tracked
    const channelToWrite = (await bot.channels.fetch(getVoiceTrack.logChannel)) as TextChannel;

    let msg = "";

    if (newState.channel === null && oldState.channel) {
      msg = `${oldState.channel}: ${oldState.member?.user} disconnected. `;
      writeToDbLog({ oldS: oldState });
    } else if (oldState.channel === null && newState.channel) {
      msg = `${newState.channel}: ${newState.member?.user} connected.`;
      writeToDbLog({ newS: newState });
    } else if (newState.channel && oldState.channel && oldState.channelId !== newState.channelId) {
      msg = `${oldState.channel} -> ${newState.channel}: ${newState.member?.user} moved.`;
      writeToDbLog({ oldS: oldState, newS: newState });
    }

    channelToWrite.send(msg);
    printDev(msg);
  });
};

function validateTracking(oldState: VoiceState, newState: VoiceState) {
  if (oldState && newState) {
    if (oldState.mute !== newState.mute) return false;
    if (oldState.serverMute !== newState.serverMute) return false;

    if (oldState.deaf !== newState.deaf) return false;
    if (oldState.serverDeaf !== newState.serverDeaf) return false;
  }
  return true;
}

async function writeToDbLog({ oldS, newS }: { oldS?: VoiceState; newS?: VoiceState }) {
  const action = oldS && newS ? 102 : oldS ? 103 : 101; // 101 - connected, 102 - moved, 103 - disconnected
  const state = newS || oldS;

  if (!state) return;

  const [insert] = await dzz
    .insert(log)
    .values({
      action,
      guildId: state.guild.id,
      guildName: state.guild.name,
      channelId: state.channel?.id,
      channelName: state.channel?.name,
      userId: state.member?.id,
      userName: state.member?.user.username,
    })
    .returning();
}
