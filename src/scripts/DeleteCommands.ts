import { REST, Routes } from "discord.js";
import { config } from "dotenv";
import { printDev, printError } from "../helpers/functions";

config();
const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);

rest
  .put(Routes.applicationCommands(process.env.APP_ID), { body: [] })
  .then(() => printDev("Successfully deleted all application commands."))
  .catch((err) => printError(true, err));
