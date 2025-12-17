import { type Interaction, type CacheType, MessageFlags } from 'discord.js';
import type { IDiscordEventHandler } from '../types/event';
import { DiscordClient } from '../client';
import type { IDiscordCommandExecuteContext } from '../types/command';

export default class InteractionCreateEventHandler implements IDiscordEventHandler<'interactionCreate'> {
  event = 'interactionCreate' as const;
  once?: boolean | undefined;
  async handle(interaction: Interaction<CacheType>): Promise<void> {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    const client = interaction.client as DiscordClient;
    const command = client.commands.get(interaction.commandName);

    if (!command) {
      console.log(`No command matching ${interaction.commandName}`);
      return;
    }

    const ctx: IDiscordCommandExecuteContext = {
      client,
      interaction,
    };

    try {
      await command.execute(ctx);
    } catch (err) {
      console.log(`Error while executing command ${interaction.commandName}`);
      console.log(err);

      const reply = interaction.replied || interaction.deferred ? interaction.followUp : interaction.reply;

      await reply.call(interaction, {
        content: 'There was an error while executing this command!',
        flags: MessageFlags.Ephemeral,
      });
    }
  }
}
