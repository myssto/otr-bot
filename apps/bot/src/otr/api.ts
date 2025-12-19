import z from 'zod';
import { playerStatsSchema, type PlayerStats } from './schema';

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

export async function getPlayerStats(id: number): Promise<PlayerStats | undefined> {
  const url = new URL(apiRoute(`/players/${id}/stats`));
  return fetchWrap(playerStatsSchema, url);
}
