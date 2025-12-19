declare namespace NodeJS {
  interface ProcessEnv {
    /** Shared secret for Cloudflare worker communication. */
    BOT_SECRET: string;

    /** Discord bot token. */
    DISCORD_TOKEN: string;

    /** Discord bot client id. */
    DISCORD_CLIENT_ID: string;

    /** Id of the guild to deploy guild-scoped application commands. */
    DISCORD_DEV_GUILD_ID?: string;

    /** osu! OAuth app id. */
    OSU_CLIENT_ID: string;

    /** osu! Tournament Rating API key. */
    OTR_API_KEY: string;

    /** Cloudflare worker URL. */
    WORKER_URL: string;
  }
}
