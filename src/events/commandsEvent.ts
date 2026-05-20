import { Events, MessageFlags } from "discord.js";
import { printError } from "../helpers/functions";
import { checkRateLimit } from "../helpers/rateLimiter";

/**
 * Event for tracking messages for slash commands.
 *
 * @param bot
 */
export const commandsEvent = (bot: ClientType) => {
  bot.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const client = interaction.client as ClientType;
    const command = client.commands.get(interaction.commandName);

    if (!command) {
      printError(false,`No command matching ${interaction.commandName} was found.`);
      return;
    }

    const rateLimit = checkRateLimit(interaction.user.id, interaction.guildId!);
    if (rateLimit.limited) {
      const seconds = (rateLimit.remainingMs / 1000).toFixed(1);
      const message =
        rateLimit.scope === "user"
          ? `You are being rate limited. Please wait ${seconds}s before using another command.`
          : `This server is being rate limited. Please wait ${seconds}s before using another command.`;
      try {
        await interaction.reply({ content: message, flags: MessageFlags.Ephemeral });
      } catch (replyError) {
        printError(false, "Failed to send rate limit reply:", replyError);
      }
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      printError(false,error);
      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: "There was an error while executing this command!",
            flags: MessageFlags.Ephemeral,
          });
        } else {
          await interaction.reply({
            content: "There was an error while executing this command!",
            flags: MessageFlags.Ephemeral,
          });
        }
      } catch (replyError) {
        printError(false,"Failed to send error reply to interaction:", replyError);
      }
    }
  });
};
