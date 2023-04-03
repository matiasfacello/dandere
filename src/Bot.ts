import { commandsCreate, commandsEvent, trackVoice } from "./events/index";

import { config } from "dotenv";
config();

import { Client, GatewayIntentBits } from "discord.js";

const bot = new Client({
  intents: [GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildPresences],
}) as ClientType;

bot.login(process.env.BOT_TOKEN);

bot.on("ready", () => {
  console.log(`${bot.user?.tag} is ready!`);
});

commandsCreate(bot);

commandsEvent(bot);

trackVoice(bot);
