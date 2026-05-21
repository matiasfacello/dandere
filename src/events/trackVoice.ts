import { dzz, eq } from "db/client";
import { log, guild } from "db/schema";
import { VoiceState, type TextChannel } from "discord.js";
import { printDev, printError } from "../helpers/functions";

export const trackVoice = (bot: ClientType) => {
  bot.on("voiceStateUpdate", async (oldState, newState) => {
    try {
      // Joining connection
      if (!oldState.channel) {
        await oneChannelBehavior(bot, newState, 101);
        return;
      }

      // Leaving connection
      if (!newState.channel) {
        await oneChannelBehavior(bot, oldState, 103);
        return;
      }

      // Cross-guild transitions are treated as a new connection in the destination guild
      if (oldState.guild.id !== newState.guild.id) {
        await oneChannelBehavior(bot, newState, 101);
        return;
      }

      await twoChannelBehavior(bot, oldState, newState);
    } catch (err) {
      printError(true,"voiceStateUpdate handler error:", err);
    }
  });
};

async function oneChannelBehavior(bot: ClientType, state: VoiceState, action: number) {
  if (!state.channel || !state.member) return;

  // Validate if the server is tracked
  const [getVoiceTrack] = await dzz.select().from(guild).where(eq(guild.guildId, state.guild.id));

  if (!getVoiceTrack || !getVoiceTrack.trackAll) return;

  printDev(getVoiceTrack);

  if (getVoiceTrack.ignoreUsers?.includes(state.member.id)) return;

  const msg = `${state.channel}: ${state.member.user} ${action === 101 ? "connected" : "disconnected"}.`;

  if (getVoiceTrack.logChannelId) {
    try {
      const channel = (await bot.channels.fetch(getVoiceTrack.logChannelId)) as TextChannel;
      await channel.send(msg);
    } catch (err) {
      printError(true,`Failed to send message to log channel ${getVoiceTrack.logChannelId}:`, err);
    }
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

  const channelChanged = oldState.channel.id !== newState.channel.id;
  const streamingChanged = oldState.streaming !== newState.streaming;

  // Skip mute/deaf/camera-only changes — only log channel moves and streaming events
  if (!channelChanged && !streamingChanged) return;

  if (streamingChanged) {
    actionNumber = newState.streaming ? 104 : 105;
  }

  const [getVoiceTrack] = await dzz.select().from(guild).where(eq(guild.guildId, newState.guild.id));

  if (!getVoiceTrack || !getVoiceTrack.trackAll) return;

  printDev(getVoiceTrack);

  if (getVoiceTrack.ignoreUsers?.includes(newState.member.id)) return;

  if (actionNumber === 104 || actionNumber === 105) {
    msg = `${newState.channel}: ${newState.member.user} ${actionNumber === 104 ? "started streaming" : "stopped streaming"}.`;
  } else {
    msg = `${oldState.channel} -> ${newState.channel}: ${newState.member.user} moved.`;
  }

  if (getVoiceTrack.logChannelId) {
    try {
      const channel = (await bot.channels.fetch(getVoiceTrack.logChannelId)) as TextChannel;
      await channel.send(msg);
    } catch (err) {
      printError(true,`Failed to send message to log channel ${getVoiceTrack.logChannelId}:`, err);
    }
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
