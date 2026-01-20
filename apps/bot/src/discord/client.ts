import { type ClientOptions, Client, Collection } from 'discord.js';
import { type IDiscordCommand, isDiscordCommand } from './types/command';
import { isDiscordEventHandler } from './types/event';
import { walkDir } from '@lib/util';
import path from 'node:path';
import { EmojiManager } from './emojis/emoji-manager';

export class DiscordClient extends Client {
  /** Collection of available commands. */
  public commands: Collection<string, IDiscordCommand> = new Collection();
  public emojiManager: EmojiManager = new EmojiManager(this);

  constructor(options: ClientOptions) {
    super(options);
  }

  /**
   * Prepare the client and login.
   */
  public async init(): Promise<void> {
    this.commands = await DiscordClient.loadCommands();
    await this.bindEvents();

    this.login();
  }

  /**
   * Creates a collection of all available application commands.
   * @returns A collection of commands, the keys being command names.
   */
  public static async loadCommands(): Promise<Collection<string, IDiscordCommand>> {
    const commands = new Collection<string, IDiscordCommand>();
    const commandFiles = walkDir(path.join(__dirname, 'commands'));

    for (const commandFile of commandFiles) {
      try {
        const cmdClass = (await import(commandFile)).default;
        const cmd = new cmdClass();

        if (!isDiscordCommand(cmd)) {
          continue;
        }

        commands.set(cmd.name, cmd);
      } catch (err) {
        console.log(`Error loading command from ${commandFile}`);
        console.log(err);
      }
    }

    return commands;
  }

  /**
   * Loads and binds event listeners to the client.
   */
  private async bindEvents(): Promise<void> {
    const eventFiles = walkDir(path.join(__dirname, 'events'));

    for (const eventFile of eventFiles) {
      try {
        const evClass = (await import(eventFile)).default;
        const evHandler = new evClass();

        if (!isDiscordEventHandler(evHandler)) {
          continue;
        }

        const bind = evHandler.once ? this.once : this.on;
        bind.call(this, evHandler.event, evHandler.handle);
      } catch (err) {
        console.log(`Error loading event handler from ${eventFile}`);
        console.log(err);
      }
    }
    console.log(`Bound ${eventFiles.length} events to the client.`);
  }
}
