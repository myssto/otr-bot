import type { DiscordClient } from '@discord/client';
import { addRulesetIntegerOption } from '@discord/lib/command-util';
import type { IDiscordCommand, IDiscordCommandExecuteContext } from '@discord/types/command';
import { countryCodeToEmoji, EmbedColors } from '@lib/util';
import {
  ApiRatingTiers,
  getLeaderboard,
  otrProfileLink,
  RatingTiers,
  Ruleset,
  type GetLeaderboardOptions,
  type LeaderboardItem,
} from '@otr';
import {
  ActionRowBuilder,
  bold,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  Colors,
  ComponentType,
  EmbedBuilder,
  inlineCode,
  italic,
  SlashCommandBuilder,
} from 'discord.js';

const BUTTON_IDS = {
  First: 'btn-first',
  Back: 'btn-back',
  Next: 'btn-next',
  Last: 'btn-last',
};

const OPTION_KEYS = {
  Ruleset: 'ruleset',
  Country: 'country',
  Tier: 'tier',
  MinOsuRank: 'min_osu_rank',
  MaxOsuRank: 'max_osu_rank',
  MinRating: 'min_rating',
  MaxRating: 'max_rating',
  MinMatches: 'min_match_playcount',
  MaxMatches: 'max_match_playcount',
  MinWinrate: 'min_winrate',
  MaxWinrate: 'max_winrate',
};

// TODO: Custom emojis w/ transparent bg
const firstButton = (curPage: number) => {
  return new ButtonBuilder()
    .setCustomId(BUTTON_IDS.First)
    .setStyle(ButtonStyle.Primary)
    .setEmoji('⏮️')
    .setDisabled(curPage === 1);
};

const backButton = (curPage: number) => {
  return new ButtonBuilder()
    .setCustomId(BUTTON_IDS.Back)
    .setStyle(ButtonStyle.Primary)
    .setEmoji('◀️')
    .setDisabled(curPage === 1);
};

const nextButton = (curPage: number, maxPages: number) => {
  return new ButtonBuilder()
    .setCustomId(BUTTON_IDS.Next)
    .setStyle(ButtonStyle.Primary)
    .setEmoji('▶️')
    .setDisabled(curPage === maxPages);
};

const lastButton = (curPage: number, maxPages: number) => {
  return new ButtonBuilder()
    .setCustomId(BUTTON_IDS.Last)
    .setStyle(ButtonStyle.Primary)
    .setEmoji('⏭️')
    .setDisabled(curPage === maxPages);
};

const buildActionRow = (curPage: number, maxPages: number) => {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    firstButton(curPage),
    backButton(curPage),
    nextButton(curPage, maxPages),
    lastButton(curPage, maxPages)
  );
};

const formatFilterString = (
  {
    ruleset,
    country,
    tiers,
    minOsuRank,
    maxOsuRank,
    minRating,
    maxRating,
    minMatches,
    maxMatches,
    minWinRate,
    maxWinRate,
  }: GetLeaderboardOptions,
  client: DiscordClient
) => {
  const filters: string[] = [];

  const formatMinMax = (base: string, min?: number | string | null, max?: number | string | null) => {
    if (!min && !max) {
      return;
    }

    if (min && max) {
      filters.push(base + `from ${inlineCode(min.toString())} to ${inlineCode(max.toString())}\n`);
    } else if (min && !max) {
      filters.push(base + `above ${inlineCode(min.toString())}\n`);
    } else {
      filters.push(base + `below ${max!.toString()}\n`);
    }
  };

  filters.push(`Ruleset: ${client.emojiManager.getRulesetEmoji(ruleset ?? Ruleset.Osu)}`);

  if (country) {
    filters.push(`Country: ${countryCodeToEmoji(country)}`);
  }

  // TODO: emoji here
  // filter uses APIRatingTiers instead of RatingTiers !!!!
  if (tiers) {
    // filters.push(`Tier: ${client.emojiManager.getTierEmoji()}`)
    filters.push(`Tier: ${inlineCode(tiers[0]!)}`);
  }
  // Add a final padding after first 3 potential 1-liners
  filters.push('\n');

  formatMinMax('osu! Rank: ', minOsuRank, maxOsuRank);
  formatMinMax('o!TR Rating: ', minRating, maxRating);
  formatMinMax('Match playcount: ', minMatches, maxMatches);
  formatMinMax(
    'Match winrate: ',
    minWinRate ? `${minWinRate * 100}%` : null,
    maxWinRate ? `${maxWinRate * 100}%` : null
  );

  return filters.join(' ');
};

const leaderboardEmbed = (
  data: LeaderboardItem[],
  options: GetLeaderboardOptions,
  maxPages: number,
  client: DiscordClient
) => {
  return new EmbedBuilder()
    .setColor(EmbedColors.OtrBlue)
    .setDescription(
      `Showing leaderboard page ${inlineCode(options.page.toString())} of ${inlineCode(maxPages.toString())}\n` +
        formatFilterString(options, client)
    )
    .addFields(
      ...data.map((item, index) => {
        index = index + (options.page - 1) * 10;
        return {
          name: '',
          value:
            `**#${(index + 1).toString()}: ` +
            `[${item.player.username}](${otrProfileLink(item.player.id)})**\n` +
            `${client.emojiManager.getTierEmoji(item.tierProgress.currentTier, item.tierProgress.currentSubTier)} ${inlineCode(item.rating.toFixed(2))} TR`,
        };
      }),
      {
        name: '',
        value: italic(
          `${bold('Note')}: Rating values are not necessarily indicitive of "skill".\nRead more about what your rating actually means [here](https://docs.otr.stagec.xyz/Rating-Framework/Rating-FAQ "o!TR Rating FAQ").`
        ),
      }
    );
};

const failEmbed = (options: GetLeaderboardOptions, client: DiscordClient) => {
  return new EmbedBuilder()
    .setColor(Colors.Red)
    .setDescription('No leaderboard results found for your query.\n' + formatFilterString(options, client));
};

export default class LeaderboardCommand implements IDiscordCommand {
  name = 'leaderboard';
  static name = 'leaderboard';
  commandData = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription('Display leaderboard rankings.')
    .addIntegerOption(addRulesetIntegerOption)
    .addStringOption((o) =>
      o
        .setName(OPTION_KEYS.Country)
        .setDescription('Filter for a specified country (ISO country code).')
        .setMinLength(2)
        .setMaxLength(2)
    )
    .addStringOption((o) =>
      o
        .setName(OPTION_KEYS.Tier)
        .setDescription('Filter for a specified rating tier.')
        .addChoices(
          { name: RatingTiers.EliteGrandmaster, value: ApiRatingTiers.EliteGrandmaster },
          { name: RatingTiers.Grandmaster, value: ApiRatingTiers.Grandmaster },
          { name: RatingTiers.Master, value: ApiRatingTiers.Master },
          { name: RatingTiers.Diamond, value: ApiRatingTiers.Diamond },
          { name: RatingTiers.Emerald, value: ApiRatingTiers.Emerald },
          { name: RatingTiers.Platinum, value: ApiRatingTiers.Platinum },
          { name: RatingTiers.Gold, value: ApiRatingTiers.Gold },
          { name: RatingTiers.Silver, value: ApiRatingTiers.Silver },
          { name: RatingTiers.Bronze, value: ApiRatingTiers.Bronze }
        )
    )
    .addIntegerOption((o) => o.setName(OPTION_KEYS.MinOsuRank).setDescription('Minimum osu! rank.').setMinValue(1))
    .addIntegerOption((o) => o.setName(OPTION_KEYS.MaxOsuRank).setDescription('Maximum osu! rank.').setMinValue(1))
    .addIntegerOption((o) => o.setName(OPTION_KEYS.MinRating).setDescription('Minimum o!TR rating.').setMinValue(1))
    .addIntegerOption((o) => o.setName(OPTION_KEYS.MaxRating).setDescription('Maximum o!TR rating.').setMinValue(1))
    .addIntegerOption((o) =>
      o.setName(OPTION_KEYS.MinMatches).setDescription('Minimum tournament match playcount.').setMinValue(1)
    )
    .addIntegerOption((o) =>
      o.setName(OPTION_KEYS.MaxMatches).setDescription('Maximum tournament match playcount.').setMinValue(1)
    )
    .addIntegerOption((o) =>
      o
        .setName(OPTION_KEYS.MinWinrate)
        .setDescription('Minimum tournament match win rate (number between 0 and 100 representing percentage).')
        .setMinValue(1)
        .setMaxValue(100)
    )
    .addIntegerOption((o) =>
      o
        .setName(OPTION_KEYS.MaxWinrate)
        .setDescription('Maximum tournament match win rate (number between 0 and 100 representing percentage).')
        .setMinValue(1)
        .setMaxValue(100)
    );

  public async execute({ interaction, client }: IDiscordCommandExecuteContext): Promise<void> {
    await interaction.deferReply();

    let maxPages = 0;
    const queryOptions: GetLeaderboardOptions = {
      page: 1,
      ...this.parseOptions(interaction),
    };
    const leaderboardCache: Map<number, LeaderboardItem[]> = new Map();
    const getItemsForUIPage = async (options: GetLeaderboardOptions): Promise<LeaderboardItem[]> => {
      const apiPage = Math.ceil(options.page / 10);
      if (!leaderboardCache.has(apiPage)) {
        const data = await getLeaderboard({ ...options, page: apiPage });
        if (data) {
          leaderboardCache.set(apiPage, data.leaderboard);
          maxPages = Math.ceil(data.total / 10);
        }
      }

      const apiData = leaderboardCache.get(apiPage) || [];
      const startIndex = ((options.page - 1) % 10) * 10;
      return apiData.slice(startIndex, startIndex + 10);
    };

    const initialPage = await getItemsForUIPage(queryOptions);
    if (initialPage.length === 0) {
      await interaction.editReply({
        embeds: [failEmbed(queryOptions, client)],
      });
      return;
    }

    const reply = await interaction.editReply({
      embeds: [leaderboardEmbed(initialPage, queryOptions, maxPages, client)],
      components: [buildActionRow(queryOptions.page, maxPages)],
    });

    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: (i) => i.user.id === interaction.user.id,
      idle: 60_000,
    });

    collector.on('collect', async (i) => {
      switch (i.customId) {
        case BUTTON_IDS.First:
          queryOptions.page = 1;
          break;
        case BUTTON_IDS.Back:
          queryOptions.page--;
          break;
        case BUTTON_IDS.Next:
          queryOptions.page++;
          break;
        case BUTTON_IDS.Last:
          queryOptions.page = maxPages;
          break;
      }

      const page = await getItemsForUIPage(queryOptions);
      await i.update({
        embeds: [leaderboardEmbed(page, queryOptions, maxPages, client)],
        components: [buildActionRow(queryOptions.page, maxPages)],
      });
    });

    collector.once('end', async () => {
      await interaction.editReply({ components: [] });
    });
  }

  private parseOptions(interaction: ChatInputCommandInteraction): Omit<GetLeaderboardOptions, 'page'> {
    // Get options
    const ruleset = interaction.options.getInteger(OPTION_KEYS.Ruleset) as Ruleset | null;
    let country = interaction.options.getString(OPTION_KEYS.Country);
    const tier = interaction.options.getString(OPTION_KEYS.Tier) as ApiRatingTiers | null;
    const minOsuRank = interaction.options.getInteger(OPTION_KEYS.MinOsuRank);
    const maxOsuRank = interaction.options.getInteger(OPTION_KEYS.MaxOsuRank);
    const minRating = interaction.options.getInteger(OPTION_KEYS.MinRating);
    const maxRating = interaction.options.getInteger(OPTION_KEYS.MaxRating);
    const minMatches = interaction.options.getInteger(OPTION_KEYS.MinMatches);
    const maxMatches = interaction.options.getInteger(OPTION_KEYS.MaxMatches);
    let minWinRate = interaction.options.getInteger(OPTION_KEYS.MinWinrate);
    let maxWinRate = interaction.options.getInteger(OPTION_KEYS.MaxWinrate);

    // Input shaping / validation
    if (country) {
      country = country.toUpperCase();
      if (!new Intl.DisplayNames(['en'], { type: 'region' }).of(country)) {
        country = null;
      }
    }

    if (minWinRate) {
      minWinRate /= 100;
    }

    if (maxWinRate) {
      maxWinRate /= 100;
    }

    return {
      ruleset,
      country,
      // Double value for temp fix, leaderboard endpoint cannot parse single tier query
      tiers: tier ? [tier, tier] : null,
      minOsuRank,
      maxOsuRank,
      minRating,
      maxRating,
      minMatches,
      maxMatches,
      minWinRate,
      maxWinRate,
    };
  }
}
