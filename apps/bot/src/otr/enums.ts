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
