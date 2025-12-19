import { Collection, Colors, EmbedBuilder, inlineCode, MessageFlags, SlashCommandBuilder } from 'discord.js';
import type { IDiscordCommand, IDiscordCommandExecuteContext } from '../types/command';
import {
  hmacSign,
  importHmacKey,
  isOauthStatusResponse,
  OAUTH_ATTEMPT_TTL,
  SIG_HEADER,
  TIMESTAMP_HEADER,
  toBase64url,
  type OAuthStatePayload,
  type OAuthStatusResponse,
} from '@otr-discord-bot/shared';
import { users, type User } from '@db/schema';
import { db } from '@db/index';

const initialEmbed = (state: OAuthStatePayload): EmbedBuilder => {
  const authUrl = new URL('https://osu.ppy.sh/oauth/authorize');
  authUrl.searchParams.set('client_id', process.env.OSU_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', `${process.env.WORKER_URL}/callback`);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'identify');
  authUrl.searchParams.set('state', toBase64url(JSON.stringify(state)));

  return new EmbedBuilder()
    .setColor(Colors.Blue)
    .setDescription(`{emoji} [Click here](${authUrl}) to link your osu! profile`)
    .setFooter({ text: `Contact myssto if you encounter any issues here!` });
};

const failEmbed = new EmbedBuilder()
  .setColor(Colors.Red)
  .setDescription('You did not authorize in time, or something went terribly wrong!');

const successEmbed = (user: User) =>
  new EmbedBuilder()
    .setColor(Colors.Green)
    .setDescription(`Successfully linked with an osu! account ${inlineCode(user.osuUsername)}`);

const OAUTH_POLLING_INTERVAL = 5000;

export default class LinkCommand implements IDiscordCommand {
  name = 'link';
  commandData = new SlashCommandBuilder().setName('link').setDescription('Link your discord with an osu! profile.');

  /** Collection of discord ids with a link attempt in progress. */
  linksInProgress: Collection<string, OAuthStatePayload> = new Collection();

  public async execute({ interaction }: IDiscordCommandExecuteContext): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const existingLink = this.linksInProgress.get(interaction.user.id);
    if (existingLink) {
      await interaction.editReply({ embeds: [initialEmbed(existingLink)] });
      return;
    }

    const authExp = Date.now() + OAUTH_ATTEMPT_TTL;
    const statePayload: OAuthStatePayload = {
      nonce: crypto.randomUUID(),
      exp: authExp,
    };
    await interaction.editReply({ embeds: [initialEmbed(statePayload)] });

    const user = await this.getOAuthResult(statePayload.nonce, interaction.user.id);
    await interaction.editReply({ embeds: [user ? successEmbed(user) : failEmbed] });
  }

  private async getOAuthResult(nonce: string, discordId: string): Promise<User | undefined> {
    let oauthResponse: OAuthStatusResponse | undefined = undefined;
    const maxRequests = OAUTH_ATTEMPT_TTL / OAUTH_POLLING_INTERVAL - 1;
    const key = await importHmacKey(process.env.BOT_SECRET);

    // Poll status endpoint
    for (let i = 0; i < maxRequests; i++) {
      await new Promise((res) => setTimeout(res, OAUTH_POLLING_INTERVAL));

      const ts = Date.now();
      const res = await fetch(`${process.env.WORKER_URL}/status?nonce=${nonce}`, {
        headers: [
          [TIMESTAMP_HEADER, ts.toString()],
          [SIG_HEADER, await hmacSign(key, `${nonce}.${ts}`)],
        ],
      });
      if (!res.ok) {
        continue;
      }

      const data = await res.json();
      if (!isOauthStatusResponse(data) || !data.complete) {
        continue;
      }

      oauthResponse = data;
      break;
    }

    if (!oauthResponse) {
      return;
    }

    const { osuId, username } = oauthResponse.data;
    const [user] = await db
      .insert(users)
      .values({
        id: discordId,
        osuId,
        osuUsername: username,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          osuId,
          osuUsername: username,
        },
      })
      .returning();

    this.linksInProgress.delete(discordId);
    return user;
  }
}
