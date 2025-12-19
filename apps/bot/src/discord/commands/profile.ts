import type { IDiscordCommand, IDiscordCommandExecuteContext } from '@discord/types/command';
import { countryFlag, profilePicture } from '@lib/osu';
import { EmbedColors } from '@lib/util';
import { getPlayerStats, otrMatch, otrProfile, Ruleset, tierToRoman, type PlayerStats } from '@otr';
import {
  ActionRowBuilder,
  bold,
  ComponentType,
  EmbedBuilder,
  inlineCode,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  time,
  TimestampStyles,
} from 'discord.js';

type SelectMenuValues = 'compact' | 'matches';

const actionRow = (selected: SelectMenuValues) => {
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder().setCustomId('profile-select').addOptions(
      {
        label: 'Compact',
        value: 'compact',
        description: 'Compact player statistics.',
        default: selected === 'compact',
      },
      {
        label: 'Matches',
        value: 'matches',
        description: 'Player match performance statistics',
        default: selected === 'matches',
      }
    )
  );
};

const baseEmbed = (player: PlayerStats): EmbedBuilder => {
  return new EmbedBuilder()
    .setColor(EmbedColors.OtrBlue)
    .setThumbnail(profilePicture(player.playerInfo.osuId))
    .setAuthor({
      name: `${player.playerInfo.username}: ${player.rating.rating.toFixed(2)} TR (#${player.rating.globalRank} • ${player.playerInfo.country}#${player.rating.countryRank})`,
      iconURL: countryFlag(player.playerInfo.country),
      url: otrProfile(player.playerInfo.id),
    })
    .setFooter({
      text: `First recorded tournament ${player.matchStats.periodStart}`,
      // iconURL: `ruleseticon`
    });
};

const compactEmbed = (player: PlayerStats) => {
  const highestRating = player.rating.adjustments.sort((a, b) => b.ratingAfter - a.ratingAfter)[0];

  return baseEmbed(player).setDescription(
    `Tier: {emoji} ${player.rating.tierProgress.currentTier} ${tierToRoman(player.rating.tierProgress.currentSubTier)}\n` +
      `Percentile: ${inlineCode(player.rating.percentile.toFixed(2))}\n` +
      `Tournaments: ${inlineCode(player.rating.tournamentsPlayed.toString())}\n` +
      `Matches: ${inlineCode(player.rating.matchesPlayed.toString())} (${inlineCode((player.rating.winRate * 100).toFixed(2) + '%')} W/L)\n` +
      `Peak rating: ${inlineCode(highestRating!.ratingAfter.toFixed(2))} (${time(new Date(highestRating!.timestamp), TimestampStyles.ShortDate)})`
  );
};

const matchesEmbed = (player: PlayerStats) => {
  const recentMatch = player.rating.adjustments
    .filter((a) => a.adjustmentType === 2)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]!;

  return baseEmbed(player)
    .setDescription(`Showing detailed ${bold('match')} statistics:`)
    .addFields(
      { name: 'Played', value: player.matchStats.matchesPlayed.toString(), inline: true },
      { name: 'Won', value: player.matchStats.matchesWon.toString(), inline: true },
      { name: 'Lost', value: player.matchStats.matchesLost.toString(), inline: true },
      { name: 'Winrate', value: `${(player.matchStats.matchWinRate * 100).toFixed(2)}%`, inline: true },
      { name: 'Avg. match cost', value: player.matchStats.averageMatchCostAggregate.toFixed(2), inline: true },
      { name: 'Avg. placement', value: player.matchStats.averagePlacingAggregate.toFixed(2), inline: true },
      {
        name: 'Avg. score',
        value: Number(player.matchStats.matchAverageScoreAggregate.toFixed(0)).toLocaleString(),
        inline: true,
      },
      {
        name: 'Avg. acc',
        value: `${(player.matchStats.matchAverageAccuracyAggregate * 100).toFixed(2)}%`,
        inline: true,
      },
      { name: 'Avg. misses', value: player.matchStats.matchAverageMissesAggregate.toFixed(2), inline: true },
      { name: 'Avg. maps played', value: player.matchStats.averageGamesPlayedAggregate.toFixed(2), inline: true },
      { name: 'Maps won', value: player.matchStats.gamesWon.toString(), inline: true },
      { name: 'Maps lost', value: player.matchStats.gamesLost.toString(), inline: true },
      {
        name: 'Most recent performance',
        value:
          `[${recentMatch.match!.name}](${otrMatch(recentMatch.matchId!)})\n` +
          `${recentMatch.ratingBefore.toFixed(2)} TR => ${recentMatch.ratingAfter.toFixed(2)} TR (${inlineCode(recentMatch.ratingDelta.toFixed(2))})`,
      }
    );
};

export default class ProfileCommand implements IDiscordCommand {
  name = 'profile';
  commandData = new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Display statistics of a user.')
    .addIntegerOption((o) =>
      o
        .setName('ruleset')
        .setDescription('Specify a ruleset.')
        .addChoices(
          { name: 'Osu', value: Ruleset.Osu },
          { name: 'Taiko', value: Ruleset.Taiko },
          { name: 'Catch', value: Ruleset.Catch },
          { name: 'Mania 4k', value: Ruleset.Mania4k },
          { name: 'Mania 7k', value: Ruleset.Mania7k }
        )
    )
    .addStringOption((o) => o.setName('username').setDescription('Specify an osu! username.'))
    .addUserOption((o) => o.setName('discord').setDescription('Specify a linked Discord user.'));

  public async execute({ interaction }: IDiscordCommandExecuteContext): Promise<void> {
    await interaction.deferReply();
    const player = await getPlayerStats(2904);

    if (!player) {
      await interaction.editReply({ content: 'xd' });
      return;
    }

    // Send initial compact embed
    let currentEmbed: SelectMenuValues = 'compact';
    const reply = await interaction.editReply({
      embeds: [this.pickEmbedBuilder(currentEmbed)(player)],
      components: [actionRow(currentEmbed)],
    });

    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      filter: (i) => i.user.id === interaction.user.id && i.customId === 'profile-select',
      time: 60_000,
    });

    // Listen for menu interactions
    collector.on('collect', async (i) => {
      const embed = i.values[0] as SelectMenuValues;
      currentEmbed = embed;
      await i.update({
        embeds: [this.pickEmbedBuilder(embed)(player)],
        components: [actionRow(embed)],
      });
    });

    collector.once('end', async () => {
      // Clear select menu
      await interaction.editReply({ components: [] });
    });
  }

  private pickEmbedBuilder(embed: SelectMenuValues): (player: PlayerStats) => EmbedBuilder {
    switch (embed) {
      case 'matches':
        return matchesEmbed;
      default:
        return compactEmbed;
    }
  }
}
