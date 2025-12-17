import { SlashCommandBuilder } from 'discord.js';
import type { IDiscordCommand, IDiscordCommandExecuteContext } from '../types/command';

export default class PingCommand implements IDiscordCommand {
  name = 'ping';
  commandData = new SlashCommandBuilder().setName('ping').setDescription('Replies with pong!');

  public async execute({ interaction }: IDiscordCommandExecuteContext): Promise<void> {
    await interaction.reply('Pong!');
  }
}
