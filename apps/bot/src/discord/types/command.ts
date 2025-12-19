import { ChatInputCommandInteraction, SharedSlashCommand } from 'discord.js';
import { DiscordClient } from '../client';

/** Interfaces a discord command. */
export interface IDiscordCommand {
  /** Name of the command. Must be unique. */
  name: string;

  /** Slash command data. */
  commandData: SharedSlashCommand;

  /**
   * Called when the command is invoked.
   * @param ctx Command context.
   */
  execute: (ctx: IDiscordCommandExecuteContext) => Promise<void> | void;
}

export interface IDiscordCommandExecuteContext {
  client: DiscordClient;
  interaction: ChatInputCommandInteraction;
}

export function isDiscordCommand(obj: unknown): obj is IDiscordCommand {
  return obj !== null && typeof obj === 'object' && 'name' in obj && 'commandData' in obj && 'execute' in obj;
}

// export interface ICommandExecuteResult {}
