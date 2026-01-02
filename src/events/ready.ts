import { Events, Client } from "discord.js";

export default {
  name: Events.ClientReady,
  once: true,
  execute(client: Client) {
    console.log(`\n--------------------------------------`);
    console.log(`🤖 Logged in as: ${client.user?.tag}`);
    console.log(`✅ Status: ONLINE`);
    console.log(`--------------------------------------\n`);
  },
};
