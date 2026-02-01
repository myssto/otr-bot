import type { DiscordClient } from '@discord/client';
import { addRulesetIntegerOption } from '@discord/lib/command-util';
import type { IDiscordCommand, IDiscordCommandExecuteContext } from '@discord/types/command';
import { countryCodeToEmoji, EmbedColors } from '@lib/util';
import { getLeaderboard, otrProfileLink, type Leaderboard } from '@otr';
import { bold, EmbedBuilder, inlineCode, italic, SlashCommandBuilder } from 'discord.js';

const placement = (place: number): string => {
  switch (place) {
    case 1:
      return '🥇';
    case 2:
      return '🥈';
    case 3:
      return '🥉';
    default:
      return `#${place.toString()}:`;
  }
};

const leaderboardEmbed = (data: Leaderboard, client: DiscordClient) => {
  const items = data.leaderboard.map((item, index) => ({ item, index })).slice(0, 10);

  return new EmbedBuilder()
    .setColor(EmbedColors.OtrBlue)
    .setDescription('Showing leaderboard')
    .addFields(
      ...items.map(({ item, index }) => ({
        name: '',
        value:
          `${placement(index + 1)} **[${item.player.username}](${otrProfileLink(item.player.id)})**\n` +
          `${client.emojiManager.getTierEmoji(item.tierProgress.currentTier, item.tierProgress.currentSubTier)} ${inlineCode(item.rating.toFixed(2))} TR`,
      })),
      {
        name: '',
        value: italic(
          `${bold('Note')}: High rating values are not necessarily indicitive of "skill".\nRead more about what your rating actually means [here](https://docs.otr.stagec.xyz/Rating-Framework/Rating-FAQ).`
        ),
      }
    );
};

export default class LeaderboardCommand implements IDiscordCommand {
  name = 'leaderboard';
  static name = 'leaderboard';
  commandData = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription('Display leaderboard rankings.')
    .addIntegerOption(addRulesetIntegerOption);

  public async execute({ interaction, client }: IDiscordCommandExecuteContext): Promise<void> {
    await interaction.deferReply();

    const leaderboard = await getLeaderboard(1);
    if (!leaderboard) {
      await interaction.editReply({
        content: 'xd',
      });
      return;
    }

    await interaction.editReply({
      embeds: [leaderboardEmbed(leaderboard, client)],
    });
  }
}
