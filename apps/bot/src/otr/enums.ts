/** Basic enum metadata */
type EnumMetadata = {
  text: string;
  description: string;
};

type EnumMetadataWithEmoji = {
  emojiName: string;
} & EnumMetadata;

/**
 * A collection of metadata describing each entry in an enumeration
 * @template T Enumeration type
 * @template M Metadata type
 */
type EnumMetadataCollection<T extends number | string, M extends EnumMetadata> = {
  [key in T]: M;
};

/**
 * Interfaces an object that stores enum metadata
 * @template T Enumeration type
 * @template M Metadata type
 */
interface IEnumHelperBase<T extends number | string, M extends EnumMetadata> {
  /** Collection of metadata */
  readonly metadata: EnumMetadataCollection<T, M>;
}

/**
 * Interfaces an object that helps with parsing enums
 * @template T Enumeration type
 * @template M Metadata type
 */
export interface IEnumHelper<T extends number | string, M extends EnumMetadata = EnumMetadata> extends IEnumHelperBase<
  T,
  M
> {
  /**
   * Gets the metadata describing a given enum value
   * @param value Enum value
   * @returns Metadata describing the given enum value
   */
  getMetadata: (value: T) => M;
}

/**
 * Creates a default implementation of an {@link IEnumHelper}
 *
 * {@link IEnumHelper.metadata} should always be overwritten
 * @template T Enumeration type
 * @template M Metadata type
 */
const defaultEnumHelper = <T extends number | string, M extends EnumMetadata = EnumMetadata>(): IEnumHelper<T, M> => ({
  metadata: {} as EnumMetadataCollection<T, M>,

  getMetadata(value) {
    return this.metadata[value];
  },
});

/**
 * Interfaces an object that helps with parsing bitwise enums
 * @template T Bitwise enumeration type
 * @template M Metadata type
 */
export interface IBitwiseEnumHelper<T extends number, M extends EnumMetadata = EnumMetadata> extends IEnumHelperBase<
  T,
  M
> {
  /**
   * Gets a list of metadata describing each flag in a given bitwise enum value
   * @param value Bitwise enum value
   * @returns Metadata describing each flag in the given bitwise enum value
   */
  getMetadata: (value: T) => M[];

  /**
   * Gets a list of individual flags in a given bitwise enum value
   * @param value Bitwise enum value
   * @returns A list of individual flags in the given bitwise enum value
   */
  getFlags: (value: T) => T[];
}

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

/**
 * Creates a default implementation of an {@link IBitwiseEnumHelper}
 *
 * {@link IBitwiseEnumHelper.metadata} should always be overwritten
 * @template T Enumeration type
 * @template M Metadata type
 */
const defaultBitwiseEnumHelper = <T extends number, M extends EnumMetadata = EnumMetadata>(
  enumObject: object
): IBitwiseEnumHelper<T, M> => ({
  metadata: {} as EnumMetadataCollection<T, M>,

  getFlags(value) {
    return getEnumFlags(value, enumObject);
  },

  getMetadata(value) {
    return this.getFlags(value).map((flag) => this.metadata[flag]);
  },
});

const noneEnumMetadata: EnumMetadata = {
  text: 'None',
  description: 'No description',
};

/** osu! Rulesets. */
export const Ruleset = {
  /** Standard. */
  Osu: 0,

  /** Taiko. */
  Taiko: 1,

  /** Catch the beat. */
  Catch: 2,

  /** Mania (not 4k or 7k). */
  ManiaOther: 3,

  /** Mania 4k. */
  Mania4k: 4,

  /** Mania 7k */
  Mania7k: 5,
} as const;

export type Ruleset = (typeof Ruleset)[keyof typeof Ruleset];

export const RulesetEnumHelper: IEnumHelper<Ruleset, EnumMetadataWithEmoji> = {
  ...defaultEnumHelper(),

  metadata: {
    [Ruleset.Osu]: {
      text: 'osu!',
      emojiName: 'osu',
      description: '',
    },
    [Ruleset.Taiko]: {
      text: 'osu!taiko',
      emojiName: 'taiko',
      description: '',
    },
    [Ruleset.Catch]: {
      text: 'osu!catch',
      emojiName: 'catch',
      description: '',
    },
    [Ruleset.ManiaOther]: {
      text: 'osu!mania (other)',
      emojiName: 'mania',
      description: '',
    },
    [Ruleset.Mania4k]: {
      text: 'osu!mania 4K',
      emojiName: 'mania4k',
      description: '',
    },
    [Ruleset.Mania7k]: {
      text: 'osu!mania 7K',
      emojiName: 'mania7k',
      description: '',
    },
  },
};

/** Denotes the source of a rating adjustment. */
export const RatingAdjustmentType = {
  /** Initial rating. */
  Initial: 0,

  /** Adjustment due to decay. */
  Decay: 1,

  /** Adjustment due to the outcome of a match. */
  Match: 2,

  /** TODO: what this */
  VolatilityDecay: 3,
} as const;

export type RatingAdjustmentType = (typeof RatingAdjustmentType)[keyof typeof RatingAdjustmentType];

/** Teams in a match. */
export const Team = {
  /** No team. */
  NoTeam: 0,

  /** Blue team. */
  Blue: 1,

  /** Red team. */
  Red: 2,
} as const;

export type Team = (typeof Team)[keyof typeof Team];

/** Grade of a score. */
export const ScoreGrade = {
  /** SS with vision mod (HD/FL) */
  SSH: 0,

  /** S with vision mod (HD/FL) */
  SH: 1,

  SS: 2,

  S: 3,

  A: 4,

  B: 5,

  C: 6,

  D: 7,
} as const;

export type ScoreGrade = (typeof ScoreGrade)[keyof typeof ScoreGrade];

export const RatingTiers = {
  EliteGrandmaster: 'Elite Grandmaster',

  Grandmaster: 'Grandmaster',

  Master: 'Master',

  Diamond: 'Diamond',

  Emerald: 'Emerald',

  Platinum: 'Platinum',

  Gold: 'Gold',

  Silver: 'Silver',

  Bronze: 'Bronze',
} as const;

export type RatingTiers = (typeof RatingTiers)[keyof typeof RatingTiers];

export const ApiRatingTiers = {
  EliteGrandmaster: 'eliteGrandmaster',

  Grandmaster: 'grandmaster',

  Master: 'master',

  Diamond: 'diamond',

  Emerald: 'emerald',

  Platinum: 'platinum',

  Gold: 'gold',

  Silver: 'silver',

  Bronze: 'bronze',
} as const;

export type ApiRatingTiers = (typeof ApiRatingTiers)[keyof typeof ApiRatingTiers];

export const SubTiers = [1, 2, 3] as const;

export const RequestKeyType = {
  Otr: 'otr',

  Osu: 'osu',

  Username: 'username',
} as const;

export type RequestKeyType = (typeof RequestKeyType)[keyof typeof RequestKeyType];

export enum Mods {
  NM = 0,
  NF = 1,
  EZ = 2,
  TD = 4,
  HD = 8,
  HR = 16,
  SD = 32,
  DT = 64,
  RX = 128,
  HT = 256,
  NC = 512,
  FL = 1024,
  AP = 2048,
  SO = 4096,
  Relax2 = 8192,
  PF = 16384,
  InvalidMods = 22688,
  '4K' = 32768,
  '5K' = 65536,
  '6K' = 131072,
  '7K' = 262144,
  '8K' = 524288,
  FI = 1048576,
  ScoreIncreaseMods = 1049688,
  RD = 2097152,
  CN = 4194304,
  Target = 8388608,
  Key9 = 16777216,
  KeyCoop = 33554432,
  Key1 = 67108864,
  Key3 = 134217728,
  Key2 = 268435456,
  KeyMod = 521109504,
  FreeModAllowed = 522171579,
  SV2 = 536870912,
  MR = 1073741824,
}
