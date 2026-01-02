import { REST, Routes } from "discord.js";
import { config } from "dotenv";

config();

const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN!);

(async () => {
  try {
    console.log(`Starting reset of application commands...`);
    console.log(`Deleteing Guilds commands in Guild: ${process.env.GUILD_ID}`);
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID!,
        process.env.GUILD_ID!
      ),
      { body: [] }
    );
    console.log(`Successfully deleted all guild commands.`);
    console.log("Global commands are cleared");
    console.log("Now run npm run deploy to redeploy fresh commands");
  } catch (error) {
    console.error("Error while resetting commands:", error);
  }
})();
