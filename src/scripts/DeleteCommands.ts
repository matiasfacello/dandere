import { REST, Routes } from "discord.js";
import { config } from "dotenv";

config();
const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);

rest
  .put(Routes.applicationCommands(process.env.APP_ID), { body: [] })
  .then(() => console.log("Successfully deleted all application commands."))
  .catch(console.error);
