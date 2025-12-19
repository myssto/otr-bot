import { config } from 'dotenv';
import { DiscordClient } from '@discord/client';
import { GatewayIntentBits } from 'discord.js';

config({ quiet: true });

const client = new DiscordClient({
  intents: GatewayIntentBits.Guilds,
  rest: { timeout: 80_000 },
});

client.init();
