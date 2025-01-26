import { dzz, eq } from "db/client";
import { log, channelTracking, guild } from "db/schema";
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
    // Joiningconnection
    if (!oldState.channel) {
      oneChannelBehavior(bot, newState, 101);
      return;
    }

    // Leaving connection
    if (!newState.channel) {
      oneChannelBehavior(bot, oldState, 103);
      return;
    }

    // Cross guild are considered only connections
    if (oldState.guild.id !== newState.guild.id) {
      oneChannelBehavior(bot, newState, 101);
      return;
    }

    twoChannelBehavior(bot, oldState, newState);
    return;
  });
};

async function oneChannelBehavior(bot: ClientType, state: VoiceState, action: number) {
  if (!state.channel || !state.member) return;

  // Validate if the server is tracked
  const [getVoiceTrack] = await dzz.select().from(guild).where(eq(guild.guildId, state.guild.id));

  if (!getVoiceTrack) return;

  printDev(getVoiceTrack);

  if (getVoiceTrack.ignoreUsers?.includes(state.member.id)) return;

  const msg = `${state.channel}: ${state.member.user} ${action === 101 ? "connected" : "disconnected"}.`;

  if (getVoiceTrack.logChannelId) {
    ((await bot.channels.fetch(getVoiceTrack.logChannelId)) as TextChannel).send(msg);
  }

  await dzz.insert(log).values({
    action,
    guildId: state.guild.id,
    guildName: state.guild.name,
    channelId: state.channel.id,
    channelName: state.channel.name,
    userId: state.member.id,
    userName: state.member.user.username,
  });

  printDev(msg);
}

async function twoChannelBehavior(bot: ClientType, oldState: VoiceState, newState: VoiceState) {
  let actionNumber = 102;
  let msg = null;

  if (!oldState.channel || !newState.channel) return;
  if (!oldState.member || !newState.member) return;

  if (oldState.mute !== newState.mute) return;
  if (oldState.serverMute !== newState.serverMute) return;

  if (oldState.deaf !== newState.deaf) return;
  if (oldState.serverDeaf !== newState.serverDeaf) return;

  if (oldState.selfVideo !== newState.selfVideo) return;

  // User started or stopped streaming
  if (oldState.streaming !== newState.streaming) {
    actionNumber = newState.streaming ? 104 : 105;
  }

  const [getVoiceTrack] = await dzz.select().from(guild).where(eq(guild.guildId, newState.guild.id));

  if (!getVoiceTrack) return;

  printDev(getVoiceTrack);

  if (getVoiceTrack.ignoreUsers?.includes(newState.member.id)) return;

  if (actionNumber === 104 || actionNumber === 105) {
    msg = `${newState.channel}: ${newState.member.user} ${actionNumber === 104 ? "started streaming" : "stopped streaming"}.`;
  } else {
    msg = `${oldState.channel} -> ${newState.channel}: ${newState.member.user} moved.`;
  }

  if (getVoiceTrack.logChannelId) {
    ((await bot.channels.fetch(getVoiceTrack.logChannelId)) as TextChannel).send(msg);
  }

  await dzz.insert(log).values({
    action: actionNumber,
    guildId: newState.guild.id,
    guildName: newState.guild.name,
    channelId: newState.channel.id,
    channelName: newState.channel.name,
    userId: newState.member.id,
    userName: newState.member.user.username,
  });

  printDev(msg);
}
