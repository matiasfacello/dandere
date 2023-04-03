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
    const channelToWrite = (await bot.channels.fetch("1091959465491824690")) as TextChannel;

    if (newState.channelId === null && oldState.channelId && channelToWrite) {
      const msg = `<@${oldState.member?.user.id}> left to <#${oldState.channelId}>`;
      channelToWrite.send(msg);
      printDev(msg);
    } else if (oldState.channelId === null && newState.channelId) {
      const msg = `<@${newState.member?.user.id}> connected to <#${newState.channelId}>`;
      channelToWrite.send(msg);
      printDev(msg);
    } else if (newState.channelId && oldState.channelId) {
      const msg = `<@${newState.member?.user.id}> moved from <#${oldState.channelId}> to <#${newState.channelId}>`;
      channelToWrite.send(msg);
      printDev(msg);
    }
  });
};
