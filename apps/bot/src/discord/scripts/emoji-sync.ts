import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import { EmojiManager } from '@discord/emojis/emoji-manager';
import { readFileSync } from 'node:fs';
import path from 'node:path';

config({ quiet: true });

type RemoteEmojiData = {
  items: {
    id: string;
    name: string;
  }[];
};

const args = process.argv.slice(2);
const hardSync = args.includes('--force') || args.includes('-f');

(async () => {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  const remoteEmojis = (await rest.get(Routes.applicationEmojis(process.env.DISCORD_CLIENT_ID))) as RemoteEmojiData;
  const localEmojis = EmojiManager.getLocalEmojis();

  if (hardSync) {
    console.log(`Hard syncing emojis... Deleting ${remoteEmojis.items.length} existing emojis.`);
    for (const emoji of remoteEmojis.items) {
      await rest.delete(Routes.applicationEmoji(process.env.DISCORD_CLIENT_ID, emoji.id));
      // Buffer for rate limit
      await new Promise((r) => setTimeout(r, 200));
    }
    remoteEmojis.items = [];
  }

  const localDiff = localEmojis.filter(([emojiName]) => !remoteEmojis.items.find((e) => e.name === emojiName));
  if (localDiff.length === 0) {
    console.log('All application emojis up to date.');
    return;
  } else {
    console.log(`Found ${localDiff.length} local emojis not synced.`);
  }

  for (const [emojiName, emojiPath] of localDiff) {
    const fullPath = path.parse(emojiPath);
    const imgType = fullPath.ext.replace('.', '');
    const imgData = readFileSync(emojiPath);
    const imgPayload = `data:image/${imgType};base64,${imgData.toBase64()}`;

    try {
      await rest.post(Routes.applicationEmojis(process.env.DISCORD_CLIENT_ID), {
        body: {
          name: emojiName,
          image: imgPayload,
        },
      });
    } catch (err) {
      console.log(`Failed to upload emoji: ${emojiName}`);
      console.log(imgPayload);
      console.log(err);
      return;
    }

    // Buffer for rate limit
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`Successfully synced ${localDiff.length} emojis.`);
})();
