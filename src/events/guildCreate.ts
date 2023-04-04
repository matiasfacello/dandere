/**
 * Event for when bot joins a guild
 *
 * @param bot
 */
export const guildCreate = (bot: ClientType) => {
  bot.on("guildCreate", async (guild) => {
    try {
      console.log(`Join a guild: ${guild.name} <${guild.id}>`);
    } catch (err) {
      console.log("Join a guild err: ", err);
    }
  });
};
