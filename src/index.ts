import { ExtendedClient } from "./structures/Client";
import { config } from "dotenv";
import fs from "fs";
import path from "path";
import { SlashCommand } from "./types";

config();

const client = new ExtendedClient();

const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

console.log("Loading commands...");

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".ts") || file.endsWith(".js"));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);

        const commandModule = require(filePath);
        const command: SlashCommand = commandModule.default || commandModule;

        if ("command" in command && "execute" in command) {
            client.commands.set(command.command.name, command);
            console.log(`Loaded command: ${command.command.name}`);
        } else {
            console.log(`Warning: Command at ${filePath} missing required properties.`);
        }
    }
}

const eventsPath = path.join(__dirname, "events");
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".ts") || file.endsWith(".js"));

    console.log("Loading events...");

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);

        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
        console.log(`Loaded event: ${event.name}`);
    }
} else {
    console.log("No events directory found, skipping event loading.");
}


client.start();