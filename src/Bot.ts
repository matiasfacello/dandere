import { Client, GatewayIntentBits } from "discord.js";
import { config } from "dotenv";
import { commandsCreate, commandsEvent, guildCreate, guildDelete, trackVoice } from "./events/index";

config();

const bot = new Client({
  intents: [GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.Guilds, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildMembers],
}) as ClientType;

bot.login(process.env.BOT_TOKEN);

bot.on("ready", () => {
  console.log(`${bot.user?.tag} is ready!`);
});

commandsCreate(bot);
commandsEvent(bot);

guildCreate(bot);
guildDelete(bot);

trackVoice(bot);
