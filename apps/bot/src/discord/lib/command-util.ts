import { Ruleset } from '@otr';
import type { SlashCommandIntegerOption } from 'discord.js';

export const addRulesetIntegerOption = (o: SlashCommandIntegerOption) =>
  o
    .setName('ruleset')
    .setDescription('Specify a ruleset.')
    .addChoices(
      { name: 'Osu', value: Ruleset.Osu },
      { name: 'Taiko', value: Ruleset.Taiko },
      { name: 'Catch', value: Ruleset.Catch },
      { name: 'Mania 4k', value: Ruleset.Mania4k },
      { name: 'Mania 7k', value: Ruleset.Mania7k }
    );
