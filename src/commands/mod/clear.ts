import { SlashCommandBuilder } from "@discordjs/builders";
import { ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits, TextChannel } from "discord.js";
import { printError } from "helpers/functions";

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

export const data = new SlashCommandBuilder()
  .setName("clear")
  .setDescription("Deletes a specified amount of messages")
  .addIntegerOption((option) => {
    return option.setName("amount").setDescription("The amount of messages to delete.").setRequired(true).setMinValue(1).setMaxValue(100);
  })
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.memberPermissions?.has("ManageMessages"))
    return interaction.reply({
      content: "You do not have permissions to manage messages.",
      flags: MessageFlags.Ephemeral,
    });
  if (!interaction.guild?.members.me?.permissions.has("ManageMessages"))
    return interaction.reply({
      content: "I do not have permissions to manage messages.",
      flags: MessageFlags.Ephemeral,
    });

  const amount = interaction.options.getInteger("amount")!;

  try {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const channel = interaction.channel as TextChannel;
    const fetched = await channel.messages.fetch({ limit: amount });

    const now = Date.now();
    const deletable = fetched.filter((m) => now - m.createdTimestamp < FOURTEEN_DAYS_MS);
    const tooOld = fetched.filter((m) => now - m.createdTimestamp >= FOURTEEN_DAYS_MS);

    let deleted = 0;
    if (deletable.size >= 2) {
      const bulkDel = await channel.bulkDelete(deletable);
      deleted = bulkDel.size;
    } else if (deletable.size === 1) {
      await deletable.first()!.delete();
      deleted = 1;
    }

    for (const msg of tooOld.values()) {
      await msg.delete();
      deleted++;
    }

    const content = fetched.size < amount
      ? `Only ${fetched.size} messages found in this channel — deleted ${deleted}.`
      : `Deleted ${deleted} messages.`;

    await interaction.editReply({ content });
  } catch (err) {
    printError(true, "Clear command err: ", err);
    try {
      await interaction.editReply({ content: `There was an error deleting the messages.` });
    } catch (replyError) {
      printError(true, "Failed to send error reply to interaction:", replyError);
    }
  }
}
