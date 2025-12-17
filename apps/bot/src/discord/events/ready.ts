import { Client } from 'discord.js';
import { IDiscordEventHandler } from '../types/event';

export default class ReadyEventHandler implements IDiscordEventHandler<'clientReady'> {
  event = 'clientReady' as const;
  once = true;
  public handle(client: Client) {
    console.log(`Client ready. Logged in as ${client.user?.tag}`);
    client.application?.fetch();
  }
}
