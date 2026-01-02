import { SlashCommandBuilder, CommandInteraction, Collection, PermissionResolvable } from "discord.js";

export interface SlashCommand {
    command: SlashCommandBuilder | any;
    execute: (interaction: CommandInteraction) => Promise<void>;
    cooldown?: number; 
    permissions?: PermissionResolvable[];
}

export interface BotConfig {
    token: string;
    clientId: string;
}