import { ApplicationEmoji, Collection } from 'discord.js';
import type { DiscordClient } from '../client';
import { walkDir } from '@lib/util';
import path from 'node:path';
import { RatingTiers } from '@otr';

export class EmojiManager {
  private emojis: Collection<string, string> = new Collection();
  private static placeholderEmoji: string = '❓';

  constructor(private client: DiscordClient) {}

  public async init(): Promise<void> {
    await this.client.application?.emojis.fetch();
    this.checkEmojiParity();
  }

  /**
   * Gets all local emoji data.
   * @returns A list of string tuples - [ emoji name, file path ]
   */
  public static getLocalEmojis(): [string, string][] {
    const emojiFiles = walkDir(path.join(__dirname, 'assets'));

    return emojiFiles.map((ef) => [path.parse(ef).name, ef]);
  }

  public getTierEmoji(tier: RatingTiers, subTier: number): string {
    const tierString =
      tier === RatingTiers.EliteGrandmaster ? `tier_${tier.replace(' ', '_')}` : `tier_${tier}${subTier}`;
    const emoji = this.client.application?.emojis.cache.find((e) => e.name === tierString);

    return EmojiManager.identifierOrPlaceholder(emoji);
  }

  private static identifierOrPlaceholder(emoji: ApplicationEmoji | undefined) {
    return emoji ? `<:${emoji.identifier}>` : EmojiManager.placeholderEmoji;
  }

  /**
   * Compares remote application emojis with local data.
   */
  private checkEmojiParity(): void {
    const localEmojis = EmojiManager.getLocalEmojis();
    const localDiff = localEmojis.filter(
      ([emojiName]) => !this.client.application?.emojis.cache.find((e) => e.name === emojiName)
    );

    if (localDiff.length === 0) {
      console.log('All application emojis up to date.');
      return;
    }

    console.log(`Found ${localDiff.length} local emojis not synced.`);
    localDiff.forEach(([emojiName, emojiPath]) => {
      console.log(`${emojiName} => ${emojiPath}`);
    });
    console.log('Run the emoji sync script to populate.');
  }
}
