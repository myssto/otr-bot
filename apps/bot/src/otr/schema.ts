import z from 'zod';
import { Ruleset } from './enums';

export const playerInfoCompactSchema = z.object({
  id: z.number(),
  osuId: z.number(),
  username: z.string(),
  country: z.string(),
  defaultRuleset: z.enum(Ruleset),
});

export type PlayerInfoCompact = z.infer<typeof playerInfoCompactSchema>;

export const playerInfoSchema = playerInfoCompactSchema.extend({
  osuLastFetch: z.string(),
  osuTrackLastFetch: z.string(),
});

export type PlayerInfo = z.infer<typeof playerInfoSchema>;

export const tierProgressScehma = z.object({
  // enum
  currentTier: z.string(),
  // enum? 1/2/3
  currentSubTier: z.number(),
  // enum
  nextTier: z.string(),
  // enum? 1/2/3
  nextSubTier: z.number().nullable(),
  ratingForNextTier: z.number(),
  ratingForNextMajorTier: z.number(),
  // enum
  nextMajorTier: z.string().nullable(),
  subTierFillPercentage: z.number(),
  majorTierFillPercentage: z.number(),
});

export type TierProgress = z.infer<typeof tierProgressScehma>;

export const matchCompactSchema = z.object({
  id: z.number(),
  name: z.string(),
  tournamentId: z.number(),
});

export type MatchCompact = z.infer<typeof matchCompactSchema>;

export const ratingAdjustmentSchema = z.object({
  playerId: z.number(),
  // enum
  adjustmentType: z.number(),
  // date
  timestamp: z.string(),
  ratingBefore: z.number(),
  ratingAfter: z.number(),
  volatilityBefore: z.number(),
  volatilityAfter: z.number(),
  matchId: z.number().nullable(),
  match: matchCompactSchema.nullable(),
  ratingDelta: z.number(),
  volatilityDelta: z.number(),
});

export type RatingAdjustment = z.infer<typeof ratingAdjustmentSchema>;

export const playerRatingSchema = z.object({
  rating: z.number(),
  volatility: z.number(),
  percentile: z.number(),
  globalRank: z.number(),
  countryRank: z.number(),
  player: playerInfoCompactSchema,
  tournamentsPlayed: z.number(),
  matchesPlayed: z.number(),
  winRate: z.number(),
  tierProgress: tierProgressScehma,
  adjustments: z.array(ratingAdjustmentSchema),
  isProvisional: z.boolean(),
});

export type PlayerRating = z.infer<typeof playerRatingSchema>;

export const matchStatsSchema = z.object({
  averageMatchCostAggregate: z.number(),
  highestRating: z.number(),
  ratingGained: z.number(),
  gamesWon: z.number(),
  gamesLost: z.number(),
  gamesPlayed: z.number(),
  matchesWon: z.number(),
  matchesLost: z.number(),
  matchesPlayed: z.number(),
  gameWinRate: z.number(),
  matchWinRate: z.number(),
  bestWinStreak: z.number(),
  matchAverageScoreAggregate: z.number(),
  matchAverageMissesAggregate: z.number(),
  matchAverageAccuracyAggregate: z.number(),
  averageGamesPlayedAggregate: z.number(),
  averagePlacingAggregate: z.number(),
  // date
  periodStart: z.string(),
  // date
  periodEnd: z.string(),
});

export type MatchStats = z.infer<typeof matchStatsSchema>;

export const modStatsSchema = z.object({
  // enum
  mods: z.number(),
  count: z.number(),
  averageScore: z.number(),
});

export type ModStats = z.infer<typeof modStatsSchema>;

export const playerFrequencySchema = z.object({
  player: playerInfoCompactSchema,
  frequency: z.number(),
});

export type PlayerFrequency = z.infer<typeof playerFrequencySchema>;

export const playerStatsSchema = z.object({
  playerInfo: playerInfoCompactSchema,
  ruleset: z.enum(Ruleset),
  rating: playerRatingSchema,
  matchStats: matchStatsSchema,
  modStats: z.array(modStatsSchema),
  frequentTeammates: z.array(playerFrequencySchema),
  frequentOpponents: z.array(playerFrequencySchema),
});

export type PlayerStats = z.infer<typeof playerStatsSchema>;
