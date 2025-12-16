declare namespace NodeJS {
  interface ProcessEnv {
    /** Discord bot token. */
    DISCORD_TOKEN: string;

    /** Discord bot client id. */
    DISCORD_CLIENT_ID: string;

    /** Id of the guild to deploy guild-scoped application commands. */
    DISCORD_DEV_GUILD_ID?: string;
  }
}
