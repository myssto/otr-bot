import type { IDiscordCommand, IDiscordCommandExecuteContext } from '@discord/types/command';
import { countryFlagLink, profilePictureLink } from '@lib/osu';
import { countryCodeToEmoji, EmbedColors } from '@lib/util';
import {
  getPlayerStats,
  otrMatchLink,
  otrProfileLink,
  RatingAdjustmentType,
  RequestKeyType,
  Ruleset,
  signedRatingDelta,
  tierToRoman,
  type PlayerStats,
} from '@otr';
import {
  ActionRowBuilder,
  bold,
  ChatInputCommandInteraction,
  ComponentType,
  EmbedBuilder,
  inlineCode,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  time,
  TimestampStyles,
} from 'discord.js';
import { eq } from 'drizzle-orm';
import { db, users } from '@db';
import type { DiscordClient } from '@discord/client';

// TODO:
// - emojis (tiers, mods)
// - validate profile data (provisional ratings)
// - err handling for data fetching

const optionKeys = {
  Ruleset: 'ruleset',
  Username: 'username',
  Discord: 'discord',
};

const actionRowCustomId = 'profile-select';

type SelectMenuValues = 'compact' | 'match-performance' | 'recent-matches' | 'player-frequency' | 'mods';

type EmbedBuilderWrapper = (player: PlayerStats, client: DiscordClient) => EmbedBuilder;

const buildActionRow = (selected: SelectMenuValues) => {
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder().setCustomId(actionRowCustomId).addOptions(
      {
        label: 'Compact',
        value: 'compact',
        description: 'Compact player statistics.',
        emoji: '🏆',
        default: selected === 'compact',
      },
      {
        label: 'Match Performance',
        value: 'match-performance',
        description: 'Match performance statistics.',
        emoji: '⚔️',
        default: selected === 'match-performance',
      },
      {
        label: 'Recent Matches',
        value: 'recent-matches',
        description: 'Recent match performances.',
        emoji: '🔁',
        default: selected === 'recent-matches',
      },
      {
        label: 'Player Frequencies',
        value: 'player-frequency',
        description: 'Frequent tournament teammates and opponents.',
        emoji: '👥',
        default: selected === 'player-frequency',
      },
      {
        label: 'Mod Performance',
        value: 'mods',
        description: 'Modded performance statistics.',
        emoji: '⚙️',
        default: selected === 'mods',
      }
    )
  );
};

const baseEmbed: EmbedBuilderWrapper = (player: PlayerStats) => {
  return new EmbedBuilder()
    .setColor(EmbedColors.OtrBlue)
    .setThumbnail(profilePictureLink(player.playerInfo.osuId))
    .setAuthor({
      name: `${player.playerInfo.username}: ${player.rating.rating.toFixed(2)} TR (#${player.rating.globalRank} • ${player.playerInfo.country}#${player.rating.countryRank})`,
      iconURL: countryFlagLink(player.playerInfo.country),
      url: otrProfileLink(player.playerInfo.id),
    })
    .setFooter({
      text: `First recorded tournament ${player.matchStats.periodStart.toUTCString()}`,
      // iconURL: `ruleseticon`
    });
};

const compactEmbed: EmbedBuilderWrapper = (player: PlayerStats, client: DiscordClient) => {
  const highestRating = player.rating.adjustments.sort((a, b) => b.ratingAfter - a.ratingAfter)[0]!;

  return baseEmbed(player, client).setDescription(
    `Tier: ${client.emojiManager.getTierEmoji(player.rating.tierProgress.currentTier, player.rating.tierProgress.currentSubTier)} ${player.rating.tierProgress.currentTier} ${tierToRoman(player.rating.tierProgress.currentSubTier)}\n` +
      `Percentile: ${inlineCode(player.rating.percentile.toFixed(2))}\n` +
      `Tournaments: ${inlineCode(player.rating.tournamentsPlayed.toString())}\n` +
      `Matches: ${inlineCode(player.rating.matchesPlayed.toString())} (${inlineCode((player.rating.winRate * 100).toFixed(2) + '%')} W/L)\n` +
      `Peak rating: ${inlineCode(highestRating.ratingAfter.toFixed(2))} (${time(highestRating.timestamp, TimestampStyles.ShortDate)})`
  );
};

const matchPerformanceEmbed: EmbedBuilderWrapper = (player: PlayerStats, client: DiscordClient) => {
  const recentMatch = player.rating.adjustments
    .filter((a) => a.adjustmentType === RatingAdjustmentType.Match)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]!;

  return baseEmbed(player, client)
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
        value: (~~player.matchStats.matchAverageScoreAggregate).toLocaleString(),
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
        name: `Most recent performance (${time(recentMatch.timestamp, TimestampStyles.RelativeTime)})`,
        value:
          `[${recentMatch.match!.name}](${otrMatchLink(recentMatch.matchId!)})\n` +
          `${recentMatch.ratingBefore.toFixed(2)} TR => ${recentMatch.ratingAfter.toFixed(2)} TR (${inlineCode(signedRatingDelta(recentMatch.ratingDelta))})`,
      }
    );
};

const recentMatchesEmbed: EmbedBuilderWrapper = (player: PlayerStats, client: DiscordClient) => {
  const matches = player.rating.adjustments
    .filter((ms) => ms.adjustmentType === RatingAdjustmentType.Match)
    .slice(0, 6);

  return baseEmbed(player, client)
    .setDescription(`Showing ${bold('recent match')} performances:`)
    .addFields(
      ...matches.map((ms) => ({
        name: '',
        value:
          `**[${ms.match!.name}](${otrMatchLink(ms.matchId!)})** ${time(ms.timestamp, TimestampStyles.RelativeTime)}\n` +
          `${ms.ratingBefore.toFixed(2)} TR => ${ms.ratingAfter.toFixed(2)} TR (${inlineCode(signedRatingDelta(ms.ratingDelta))})`,
      }))
    );
};

const playerFrequencyEmbed: EmbedBuilderWrapper = (player: PlayerStats, client: DiscordClient) => {
  const padding = { name: '', value: '', inline: true };

  return baseEmbed(player, client)
    .setDescription(`Showing ${bold('player frequency')} statistics:`)
    .addFields(
      { name: 'Teammate', value: '', inline: true },
      { name: 'Appearances', value: '', inline: true },
      padding,
      ...player.frequentTeammates.slice(0, 3).flatMap((f) => [
        {
          name: '',
          value: `${countryCodeToEmoji(f.player.country)}  [${f.player.username}](${otrProfileLink(f.player.id)})`,
          inline: true,
        },
        {
          name: '',
          value: f.frequency.toString(),
          inline: true,
        },
        padding,
      ]),
      { name: 'Opponent', value: '', inline: true },
      { name: 'Appearances', value: '', inline: true },
      padding,
      ...player.frequentOpponents.slice(0, 3).flatMap((f) => [
        {
          name: '',
          value: `${countryCodeToEmoji(f.player.country)} [${f.player.username}](${otrProfileLink(f.player.id)})`,
          inline: true,
        },
        {
          name: '',
          value: f.frequency.toString(),
          inline: true,
        },
        padding,
      ])
    );
};

const modsEmbed: EmbedBuilderWrapper = (player: PlayerStats, client: DiscordClient) => {
  return baseEmbed(player, client)
    .setDescription(`Showing detailed ${bold('modded performance')} statistics:`)
    .addFields(
      { name: 'Mod', value: '', inline: true },
      { name: 'Play Count', value: '', inline: true },
      { name: 'Avg. Score', value: '', inline: true },
      ...player.modStats
        .sort((a, b) => b.count - a.count)
        .slice(0, 6)
        .flatMap((ms) => [
          // TODO: mod emoji
          { name: '', value: ms.mods.toString(), inline: true },
          { name: '', value: ms.count.toString(), inline: true },
          { name: '', value: (~~ms.averageScore).toLocaleString(), inline: true },
        ])
    );
};

const buildEmbed = (embed: SelectMenuValues): EmbedBuilderWrapper => {
  switch (embed) {
    case 'match-performance':
      return matchPerformanceEmbed;
    case 'recent-matches':
      return recentMatchesEmbed;
    case 'player-frequency':
      return playerFrequencyEmbed;
    case 'mods':
      return modsEmbed;
    default:
      return compactEmbed;
  }
};

export default class ProfileCommand implements IDiscordCommand {
  name = 'profile';
  commandData = new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Display statistics of a user.')
    .addIntegerOption((o) =>
      o
        .setName(optionKeys.Ruleset)
        .setDescription('Specify a ruleset.')
        .addChoices(
          { name: 'Osu', value: Ruleset.Osu },
          { name: 'Taiko', value: Ruleset.Taiko },
          { name: 'Catch', value: Ruleset.Catch },
          { name: 'Mania 4k', value: Ruleset.Mania4k },
          { name: 'Mania 7k', value: Ruleset.Mania7k }
        )
    )
    .addStringOption((o) => o.setName(optionKeys.Username).setDescription('Specify an osu! username.'))
    .addUserOption((o) => o.setName(optionKeys.Discord).setDescription('Specify a linked Discord user.'));

  public async execute({ interaction, client }: IDiscordCommandExecuteContext): Promise<void> {
    await interaction.deferReply();

    // const player = await this.getPlayerFromOptions(interaction);
    const player = await getPlayerStats('mrekk', RequestKeyType.Username);
    if (!player) {
      // TODO: handle this error
      await interaction.editReply({ content: 'xd' });
      return;
    }

    // Send initial compact embed
    const reply = await interaction.editReply({
      embeds: [buildEmbed('compact')(player, client)],
      components: [buildActionRow('compact')],
    });

    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      filter: (i) => i.user.id === interaction.user.id && i.customId === actionRowCustomId,
      idle: 60_000,
    });

    // Listen for menu interactions
    collector.on('collect', async (i) => {
      const embed = i.values[0] as SelectMenuValues;
      await i.update({
        embeds: [buildEmbed(embed)(player, client)],
        components: [buildActionRow(embed)],
      });
    });

    // Clear select menu
    collector.once('end', async () => {
      await interaction.editReply({ components: [] });
    });
  }

  private async getPlayerFromOptions(interaction: ChatInputCommandInteraction): Promise<PlayerStats | undefined> {
    const ruleset = interaction.options.getInteger(optionKeys.Ruleset) as Ruleset | null;
    const discordUser = interaction.options.getUser(optionKeys.Discord);
    const osuUsername = interaction.options.getString(optionKeys.Username);

    if (osuUsername) {
      return getPlayerStats(osuUsername, RequestKeyType.Username, ruleset);
    }

    const target = discordUser ? discordUser.id : interaction.user.id;
    const [user] = await db.select().from(users).where(eq(users.id, target));
    if (!user) {
      return;
    }

    return getPlayerStats(user.osuId, RequestKeyType.Osu, ruleset);
  }
}
