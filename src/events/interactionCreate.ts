import { Interaction, Events, MessageFlags } from "discord.js";
import { ExtendedClient } from "../structures/Client";

export default {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) return;

    const client = interaction.client as ExtendedClient;
    const command = client.commands.get(interaction.commandName);

    if (!command) {
      console.error(
        `No command matching ${interaction.commandName} was found.`
      );
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error: any) {
      if (error.code === 10062 || error.code === 404) {
        console.warn(
          `Interaction ${interaction.commandName} expired (Bot late response > 3 seconds).`
        );
        return;
      }

      console.error(`Error executing ${interaction.commandName}:`, error);

      if (interaction.replied || interaction.deferred) {
        await interaction
          .followUp({
            content: "There was an error while executing this command!",
            flags: MessageFlags.Ephemeral,
          })
          .catch(() => {});
      } else {
        await interaction
          .reply({
            content: "There was an error while executing this command!",
            flags: MessageFlags.Ephemeral,
          })
          .catch(() => {});
      }
    }
  },
};
