import {
  SlashCommandBuilder,
  EmbedBuilder,
  CommandInteraction,
} from "discord.js";
import axios from "axios";
import { DateTime } from "luxon";
import https from "https";
import { SlashCommand } from "../../types";

const command: SlashCommand = {
  command: new SlashCommandBuilder()
    .setName("status")
    .setDescription(
      "Get the current server status & online players of Growtopia."
    ),

  async execute(interaction: CommandInteraction) {
    await interaction.deferReply();

    try {
      const res = await axios.get("https://www.growtopiagame.com/detail", {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "application/json",
        },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        family: 4,
        timeout: 15000,
      });

      const rawOnline = res.data.online_user;
      const online = parseInt(rawOnline);
      const safeOnline = isNaN(online) ? 0 : online;
      const status = safeOnline === 0 ? "📉 Maintenance" : "🆙 UP";

      const rawImgPath = res.data.world_day_images.full_size;
      const match = rawImgPath.match(/worlds\/(.+)\.png/);

      let displayName = "Unknown";
      let cleanName = "";

      if (match && match[1]) {
        cleanName = match[1];
        displayName = cleanName.toUpperCase();
      }

      const finalImageUrl = `https://s3.amazonaws.com/world.growtopiagame.com/${cleanName}.png`;

      const gtNow = DateTime.now().setZone("America/New_York");
      const gtTime = gtNow.toFormat("HH:mm:ss");

      const embed = new EmbedBuilder()
        .setTitle("**GROWTOPIA SERVER STATUS**")
        .setDescription(
          `*💻 STATUS SERVER:* **${status}**
           *👥 ONLINE PLAYERS:* **${safeOnline.toLocaleString()}**
           *⏰ GROWTOPIA TIME:* **${gtTime}**
           *<:Ultra_Trophy_3000:1401505755563032607> WORLD OF THE DAY:* **${displayName}**
           `
        )
        .setImage(finalImageUrl)
        .setColor(safeOnline === 0 ? 0xff0000 : 0x00ff00)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error(`[Status Cmd Error]`, error);

      const errorEmbed = new EmbedBuilder()
        .setTitle("Connection Error")
        .setDescription(
          "Could not connect to Growtopia server. Please try again later."
        )
        .setColor(0xff0000)
        .setTimestamp();

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },
};

export default command;
