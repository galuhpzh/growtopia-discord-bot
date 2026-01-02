import { REST, Routes } from "discord.js";
import { config } from "dotenv";
import fs from "fs";
import path from "path";
import { SlashCommand } from "./types";

config();

const commands: SlashCommand[] = [];
const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

console.log("Starting command deployment...");

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file: string) => file.endsWith(".ts") || file.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const commandModule = require(filePath);
    const command = commandModule.default || commandModule;

    console.log(`Checking ${file}:`, command);

    if ("command" in command && "execute" in command) {
      commands.push(command.command.toJSON());
      console.log(`Prepared command for deployment: ${command.command.name}`);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "command" or "execute" property.`
      );
    }
  }
}

const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN!);

(async () => {
  try {
    console.log(`Deploying commands ${commands.length}`);
    const data = await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID!),
      { body: commands }
    );
    console.log("Successfully deployed commands.");
  } catch (error) {
    console.error("Error deploying commands:", error);
  }
})();
