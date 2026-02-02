import z from 'zod';
import { leaderboardSchema, playerStatsSchema, type Leaderboard, type PlayerStats } from './schema';
import { ApiRatingTiers, RequestKeyType, Ruleset } from './enums';

const OTR_API_BASEURL = 'https://otr.stagec.xyz/api';
const apiRoute = (endpoint: string) => new URL(`${OTR_API_BASEURL}${endpoint}`);

const QUERY_PARAM_KEYS = {
  KeyType: 'keyType',
  Ruleset: 'ruleset',
  Page: 'page',
  PageSize: 'pageSize',
};

async function fetchWrap<T extends z.ZodObject>(
  schema: T,
  input: string | URL | Request,
  init?: RequestInit
): Promise<z.infer<T> | undefined> {
  try {
    const auth = {
      Authorization: `Bearer ${process.env.OTR_API_KEY}`,
    };
    const res = await fetch(
      input,
      init
        ? init && {
            headers: init.headers && auth,
          }
        : {
            headers: auth,
          }
    );

    if (!res.ok) {
      return;
    }

    const body = await res.json();
    return schema.parse(body);
  } catch (err) {
    console.log(err);
  }
}

export async function getPlayerStats(
  id: number | string,
  keyType: RequestKeyType,
  ruleset?: Ruleset | null
): Promise<PlayerStats | undefined> {
  const url = apiRoute(`/players/${id}/stats`);
  url.searchParams.set(QUERY_PARAM_KEYS.KeyType, keyType);
  if (ruleset) {
    url.searchParams.set(QUERY_PARAM_KEYS.Ruleset, ruleset.toString());
  }
  return fetchWrap(playerStatsSchema, url);
}

export type GetLeaderboardOptions = {
  page: number;
  ruleset?: Ruleset | null;
  country?: string | null;
  minOsuRank?: number | null;
  maxOsuRank?: number | null;
  minRating?: number | null;
  maxRating?: number | null;
  minMatches?: number | null;
  maxMatches?: number | null;
  minWinRate?: number | null;
  maxWinRate?: number | null;
  tiers?: ApiRatingTiers[] | null;
};

export async function getLeaderboard({ page }: GetLeaderboardOptions): Promise<Leaderboard | undefined> {
  const url = apiRoute(`/leaderboard`);
  url.searchParams.set(QUERY_PARAM_KEYS.Page, page.toString());
  url.searchParams.set(QUERY_PARAM_KEYS.PageSize, '100');

  return fetchWrap(leaderboardSchema, url);
}
