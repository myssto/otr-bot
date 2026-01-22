import { Ruleset } from './enums';

/**
 * Formats a link to an o!TR player profile.
 * @param id o!TR player id OR osu! username.
 */
export const otrProfileLink = (id: number | string) => `https://otr.stagec.xyz/players/${id}`;

/**
 * Formats a link to an o!TR match.
 * @param id o!TR match id.
 */
export const otrMatchLink = (id: number) => `https://otr.stagec.xyz/matches/${id}`;

/**
 * Gets the roman numeral string for a tier.
 * @param tier Literal tier number.
 */
export const tierToRoman = (tier: number | 1 | 2 | 3) => {
  switch (tier) {
    case 1:
      return 'I';
    case 2:
      return 'II';
    default:
      return 'III';
  }
};

/**
 * Formats a change in rating to a 'signed' string.
 * @param delta Change in rating.
 * @example
 * ```
 * const rating = -24.1551972
 * signedRatingDelta(rating);
 * >>> "-24.15"
 *
 * const rating = 62.925182
 * signedRatingDelta(rating);
 * >>> "+62.92"
 * ```
 */
export const signedRatingDelta = (delta: number): string => {
  const result = delta.toFixed(2);

  return delta > 0 ? '+' + result : result;
};

/**
 * Gets the string identifier of a ruleset.
 * @param ruleset Ruleset.
 */
export const rulesetToStr = (ruleset: Ruleset): string => {
  switch (ruleset) {
    case Ruleset.Osu:
      return 'osu';
    case Ruleset.Taiko:
      return 'taiko';
    case Ruleset.Catch:
      return 'catch';
    case Ruleset.ManiaOther:
      return 'mania';
    case Ruleset.Mania4k:
      return 'mania4k';
    case Ruleset.Mania7k:
      return 'mania7k';
  }
};

/** Produces an array of individual flags from a bitwise enumeration */
export function getEnumFlags<T extends object>(value: number | undefined, enumType: T) {
  const flags: T[keyof T][] = [];

  if (!value) {
    return flags;
  }

  for (const [enumKey, enumValue] of Object.entries(enumType)) {
    if (typeof enumValue === 'number' && enumValue !== 0 && (value & enumValue) === enumValue) {
      flags.push(enumType[enumKey as keyof T]);
    }
  }

  return flags;
}
