import {
  SlashCommandBuilder,
  EmbedBuilder,
  CommandInteraction,
  ColorResolvable,
} from "discord.js";
import axios from "axios";
import * as cheerio from "cheerio";
import https from "https";
import { SlashCommand } from "../../types";

interface LeaderboardEntry {
  rank: string;
  growid: string;
  points: string;
  league: string;
}

interface LeagueData {
  emoji: string;
  color: ColorResolvable;
}

interface ScrapeResult {
  leaderboard: Record<string, LeaderboardEntry[]>;
  lastUpdated: string;
}

const LEAGUE_CONFIG: Record<string, LeagueData> = {
  "Top Scorer": {
    emoji: "<:Ultra_Trophy_3000:1401505755563032607>",
    color: 0xffd700,
  },
  "Bronze 1": { emoji: "<:Bronze1:1401342950864191560>", color: 0xcd7f32 },
  "Bronze 2": { emoji: "<:Bronze2:1401342975883219124>", color: 0xcd7f32 },
  "Bronze 3": { emoji: "<:Bronze3:1401342997513109504>", color: 0xcd7f32 },
  "Silver 1": { emoji: "<:Silver1:1401343990141288499>", color: 0xc0c0c0 },
  "Silver 2": { emoji: "<:Silver2:1401344017932750858>", color: 0xc0c0c0 },
  "Silver 3": { emoji: "<:Silver3:1401344043081928764>", color: 0xc0c0c0 },
  "Gold 1": { emoji: "<:Gold1:1401343091465654312>", color: 0xffd700 },
  "Gold 2": { emoji: "<:Gold2:1401343111652839584>", color: 0xffd700 },
  "Gold 3": { emoji: "<:Gold3:1401343133601759293>", color: 0xffd700 },
  "Ruby 1": { emoji: "<:Ruby1:1401343200064438384>", color: 0xe0115f },
  "Ruby 2": { emoji: "<:Ruby2:1401343224383017031>", color: 0xe0115f },
  "Ruby 3": { emoji: "<:Ruby3:1401343253139161198>", color: 0xe0115f },
  "Emerald 1": { emoji: "<:Emerald1:1401343020472991835>", color: 0x50c878 },
  "Emerald 2": { emoji: "<:Emerald2:1401343045449940992>", color: 0x50c878 },
  "Emerald 3": { emoji: "<:Emerald3:1401343067625361585>", color: 0x50c878 },
  "Sapphire 1": { emoji: "<:Sapphire1:1401343291341144135>", color: 0x0f52ba },
  "Sapphire 2": { emoji: "<:Sapphire2:1401343940690448475>", color: 0x0f52ba },
  "Sapphire 3": { emoji: "<:Sapphire3:1401343962052296795>", color: 0x0f52ba },
};

const LEAGUE_NAMES = Object.keys(LEAGUE_CONFIG);

async function fetchLeaderboard(): Promise<ScrapeResult> {
  const url = "https://growtopiagame.com/leaderboard";

  const res = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
    },
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  });

  const $ = cheerio.load(res.data);

  const updatedElement = $(".answer-footer .last-updated").first();
  const lastUpdated = updatedElement.length
    ? updatedElement.text().trim()
    : "Unknown";

  const tables = $("table");
  const leaderboard: Record<string, LeaderboardEntry[]> = {};
  const leagueBaseNames = [
    "Bronze",
    "Silver",
    "Gold",
    "Ruby",
    "Emerald",
    "Sapphire",
  ];

  tables.each((i, table) => {
    let label: string;

    if (i === 0) {
      label = "Top Scorer";
    } else {
      const leagueIndex = Math.floor((i - 1) / 3);
      const tier = ((i - 1) % 3) + 1;

      if (leagueIndex < leagueBaseNames.length) {
        const name = leagueBaseNames[leagueIndex];
        label = `${name} ${tier}`;
      } else {
        label = `Unknown League ${i}`;
      }
    }

    const entries: LeaderboardEntry[] = [];

    $(table)
      .find("tr")
      .slice(1)
      .each((_, row) => {
        const rank = $(row).find("th").text().trim();
        const cells = $(row).find("td");

        if (cells.length >= 2) {
          entries.push({
            rank,
            growid: $(cells[0]).text().trim(),
            points: $(cells[1]).text().trim(),
            league: $(cells[2]).text().trim(),
          });
        }
      });

    leaderboard[label] = entries;
  });

  return { leaderboard, lastUpdated };
}

const command: SlashCommand = {
  command: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Check the Growtopia dungeon leaderboard")
    .addStringOption((option) =>
      option
        .setName("league")
        .setDescription("Select the league to view")
        .setRequired(true)
        .addChoices(...LEAGUE_NAMES.map((name) => ({ name, value: name })))
    ),

  async execute(interaction: CommandInteraction) {
    if (!interaction.isChatInputCommand()) return;

    const choice = interaction.options.getString("league", true);
    await interaction.deferReply();

    try {
      const { leaderboard, lastUpdated } = await fetchLeaderboard();

      if (!leaderboard[choice]) {
        const errorEmbed = new EmbedBuilder()
          .setTitle("Leaderboard Not Found")
          .setDescription(`No data available for: **${choice}**`)
          .setColor(0xff0000)
          .setTimestamp();

        await interaction.editReply({ embeds: [errorEmbed] });
        return;
      }

      const config = LEAGUE_CONFIG[choice];
      const emoji = config?.emoji || "";
      const color = config?.color || 0x00ae86;

      const lines = leaderboard[choice].slice(0, 20).map((entry) => {
        const leagueSuffix = entry.league ? ` (${entry.league})` : "";
        return `**${entry.rank}.** ${entry.growid} - ${entry.points} pts${leagueSuffix}`;
      });

      const embed = new EmbedBuilder()
        .setTitle(`${emoji} ${choice.toUpperCase()} Leaderboard`)
        .setDescription(`**__Scores:__**\n\n${lines.join("\n")}`)
        .setColor(color)
        .setFooter({
          iconURL: interaction.user.displayAvatarURL({ extension: "png" }),
          text: ` ${interaction.user.username} | Last Updated: ${lastUpdated}`,
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error("[Leaderboard Error]", err);

      const errorEmbed = new EmbedBuilder()
        .setTitle("Error")
        .setDescription("Failed to fetch leaderboard data from Growtopia.")
        .setColor(0xff0000);

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },
};

export default command;
