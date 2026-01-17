import z from 'zod';
import { playerStatsSchema, type PlayerStats } from './schema';
import { queryParamKeys, RequestKeyType, Ruleset } from './enums';

const OTR_API_BASEURL = 'https://otr.stagec.xyz/api';
const apiRoute = (endpoint: string) => `${OTR_API_BASEURL}${endpoint}`;

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
  const url = new URL(apiRoute(`/players/${id}/stats`));
  url.searchParams.set(queryParamKeys.KeyType, keyType);
  if (ruleset) {
    url.searchParams.set(queryParamKeys.Ruleset, ruleset.toString());
  }
  return fetchWrap(playerStatsSchema, url);
}
