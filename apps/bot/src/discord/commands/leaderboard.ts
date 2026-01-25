import { addRulesetIntegerOption } from '@discord/lib/command-util';
import type { IDiscordCommand, IDiscordCommandExecuteContext } from '@discord/types/command';
import { SlashCommandBuilder } from 'discord.js';

export default class LeaderboardCommand implements IDiscordCommand {
  name = 'leaderboard';
  static name = 'leaderboard';
  commandData = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription('Display leaderboard rankings.')
    .addIntegerOption(addRulesetIntegerOption);

  public async execute({ interaction }: IDiscordCommandExecuteContext): Promise<void> {}
}
