import {
  SlashCommandBuilder,
  EmbedBuilder,
  CommandInteraction,
} from "discord.js";
import axios from "axios";
import { SlashCommand } from "../../types";

async function checkImageAvailability(url: string): Promise<boolean> {
  try {
    await axios.head(url, {
      timeout: 8000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        Accept:
          "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
    });
    return true;
  } catch (error) {
    return false;
  }
}

const command: SlashCommand = {
  command: new SlashCommandBuilder()
    .setName("render")
    .setDescription("View the rendered image of a specific Growtopia world")
    .addStringOption((option) =>
      option
        .setName("world")
        .setDescription("The name of world to render")
        .setRequired(true)
    ),

  async execute(interaction: CommandInteraction) {
    if (!interaction.isChatInputCommand()) return;

    const worldNameInput = interaction.options.getString("world", true);
    const cleanWorldName = worldNameInput.trim().toLowerCase();

    await interaction.deferReply();

    try {
      const imageUrl = `https://s3.amazonaws.com/world.growtopiagame.com/${cleanWorldName}.png`;

      const isRendered = await checkImageAvailability(imageUrl);

      const embed = new EmbedBuilder()
        .setTitle(`🌍 World Render: **${cleanWorldName.toUpperCase()}**`)
        .setTimestamp()
        .setFooter({
          text: `Requested by ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL({ extension: "png" }),
        });

      if (isRendered) {
        embed.setColor(0x00ae86);
        embed.setDescription(
          `Here is the latest render for **${cleanWorldName.toUpperCase()}**.`
        );
        embed.setImage(imageUrl);
      } else {
        embed.setColor(0xff0000);
        embed.setDescription(
          `⚠️ **Render Unavailable**\n\n` +
            `Could not load the render for **"${cleanWorldName.toUpperCase()}"**.\n` +
            `> **Possible Reasons:**\n` +
            `> 1. World has never been rendered (owner must render it in-game).\n` +
            `> 2. World is banned/inaccessible.`
        );
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("[Render Command Error]", error);

      const errorEmbed = new EmbedBuilder()
        .setTitle("System Error")
        .setDescription(
          "An unexpected error occurred while processing the command."
        )
        .setColor(0xff0000);

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },
};

export default command;
