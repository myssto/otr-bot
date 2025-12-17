import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import { DiscordClient } from '../client';

config({ quiet: true });

const args = process.argv.slice(2);
const global = args.includes('--global') || args.includes('-g');

if (!global && !process.env.DISCORD_DEV_GUILD_ID) {
  throw new Error('DISCORD_DEV_GUILD_ID must be set if not deploying application commands globally.');
}

(async () => {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  const commands = await DiscordClient.loadCommands();

  const payload = {
    body: commands.map((cmd) => cmd.commandData.toJSON()),
  };

  if (global) {
    await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), payload);
    console.log(`Deployed ${commands.size} application command(s) globally.`);
  } else {
    await rest.put(
      Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_DEV_GUILD_ID!),
      payload
    );
    console.log(`Deployed ${commands.size} application command(s) to development guild.`);
  }
})();
