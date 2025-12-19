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
