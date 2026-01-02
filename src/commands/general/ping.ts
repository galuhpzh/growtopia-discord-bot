import { SlashCommandBuilder, CommandInteraction } from "discord.js";
import { SlashCommand } from "../../types";

const command: SlashCommand = {
  command: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!"),
  execute: async (interaction: CommandInteraction) => {
    await interaction.reply({
      content: `Pong latency is ${
        Date.now() - interaction.createdTimestamp
      }ms!`,
    });
  },
};

export default command;
