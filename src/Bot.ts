import { config } from "dotenv";
config();

import { Client, GatewayIntentBits, Guild, TextChannel } from "discord.js";

const bot = new Client({ intents: [GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildPresences, GatewayIntentBits.Guilds] });

bot.login(process.env.BOT_TOKEN);

bot.on("ready", () => {
  console.log(`Logged in as ${bot.user?.tag}!`);
});

bot.on("voiceStateUpdate", async (oldState, newState) => {
  const channelToWrite = (await bot.channels.fetch("1091959465491824690")) as TextChannel;

  if (newState.channelId === null && oldState.channelId && channelToWrite) {
    const msg = `<@${oldState.member?.user.id}> left to <#${oldState.channelId}>`;
    channelToWrite.send(msg);
    console.log(msg);
  } else if (oldState.channelId === null && newState.channelId) {
    const msg = `<@${newState.member?.user.id}> connected to <#${newState.channelId}>`;
    channelToWrite.send(msg);
    console.log(msg);
  } else if (newState.channelId && oldState.channelId) {
    const msg = `<@${newState.member?.user.id}> moved from <#${oldState.channelId}> to <#${newState.channelId}>`;
    channelToWrite.send(msg);
    console.log(msg);
  }
});
