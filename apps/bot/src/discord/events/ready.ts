import { Client } from 'discord.js';
import type { IDiscordEventHandler } from '../types/event';
import type { DiscordClient } from '@discord/client';

export default class ReadyEventHandler implements IDiscordEventHandler<'clientReady'> {
  event = 'clientReady' as const;
  once = true;
  public async handle(client: Client) {
    console.log(`Client ready. Logged in as ${client.user?.tag}`);

    await client.application?.fetch();
    await (client as DiscordClient).emojiManager.init();
  }
}
