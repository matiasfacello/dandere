import { trackVoice } from "./events/index";
import { config } from "dotenv";
config();

import { Client, Collection, GatewayIntentBits } from "discord.js";

const bot = new Client({ intents: [GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildPresences, GatewayIntentBits.Guilds] });

bot.login(process.env.BOT_TOKEN);

bot.on("ready", () => {
  console.log(`${bot.user?.tag} is ready!`);
});

trackVoice(bot);
