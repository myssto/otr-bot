import type { DiscordClient } from '@discord/client';
import { addRulesetIntegerOption } from '@discord/lib/command-util';
import type { IDiscordCommand, IDiscordCommandExecuteContext } from '@discord/types/command';
import { EmbedColors } from '@lib/util';
import { getLeaderboard, otrProfileLink, type LeaderboardItem } from '@otr';
import {
  ActionRowBuilder,
  bold,
  ButtonBuilder,
  ButtonStyle,
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

const leaderboardEmbed = (data: LeaderboardItem[], curPage: number, maxPages: number, client: DiscordClient) => {
  const items = data.map((item, index) => ({ item, index: index + (curPage - 1) * 10 }));

  return new EmbedBuilder()
    .setColor(EmbedColors.OtrBlue)
    .setDescription(`Showing leaderboard page ${inlineCode(curPage.toString())} of ${inlineCode(maxPages.toString())}`)
    .addFields(
      ...items.map(({ item, index }) => ({
        name: '',
        value:
          `**#${(index + 1).toString()}: ` +
          `[${item.player.username}](${otrProfileLink(item.player.id)})**\n` +
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

    let maxPages = 0;
    let curPage = 1;
    const leaderboardCache: Map<number, LeaderboardItem[]> = new Map();
    const getItemsForUIPage = async (uiPage: number): Promise<LeaderboardItem[]> => {
      const apiPage = Math.ceil(uiPage / 10);
      if (!leaderboardCache.has(apiPage)) {
        const data = await getLeaderboard({ page: apiPage });
        if (data) {
          leaderboardCache.set(apiPage, data.leaderboard);
          maxPages = Math.ceil(data.total / 10);
        }
      }

      const apiData = leaderboardCache.get(apiPage) || [];
      const startIndex = ((uiPage - 1) % 10) * 10;
      return apiData.slice(startIndex, startIndex + 10);
    };

    const initialPage = await getItemsForUIPage(curPage);
    if (initialPage.length === 0) {
      await interaction.editReply({
        content: 'xd',
      });
      return;
    }

    const reply = await interaction.editReply({
      embeds: [leaderboardEmbed(initialPage, curPage, maxPages, client)],
      components: [buildActionRow(curPage, maxPages)],
    });

    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: (i) => i.user.id === interaction.user.id,
      idle: 60_000,
    });

    collector.on('collect', async (i) => {
      switch (i.customId) {
        case BUTTON_IDS.First:
          curPage = 1;
          break;
        case BUTTON_IDS.Back:
          curPage--;
          break;
        case BUTTON_IDS.Next:
          curPage++;
          break;
        case BUTTON_IDS.Last:
          curPage = maxPages;
          break;
      }

      const page = await getItemsForUIPage(curPage);
      await i.update({
        embeds: [leaderboardEmbed(page, curPage, maxPages, client)],
        components: [buildActionRow(curPage, maxPages)],
      });
    });

    collector.once('end', async () => {
      await interaction.editReply({ components: [] });
    });
  }
}
