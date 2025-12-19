import { fromBase64url, isOAuthStatePayload, type OAuthResultPayload } from '@otr-discord-bot/shared';
import { badRequest } from 'src/util';

export const callbackHandler: ExportedHandlerFetchHandler<Env> = async (req, env) => {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (!code || !state) {
    return badRequest();
  }

  // Decode and validate state
  let payload;
  try {
    payload = JSON.parse(fromBase64url(state));
    if (!isOAuthStatePayload(payload)) {
      throw new Error('Invalid state payload');
    }
  } catch {
    return badRequest();
  }

  const { nonce, exp } = payload;
  if (Date.now() > exp) {
    return badRequest('Authorization attempt expired. Try again.');
  }
  if (await env.OAUTH_RESULTS.get(nonce)) {
    return badRequest('Authorization attempt already in progress.');
  }

  // Exchange auth code for osu! user data
  const osuData = await exchangeCode(env, code);
  if (!osuData) {
    return badRequest();
  }

  // Temporarily store results in KV
  // Expiration = OAuth expiration in seconds + minute buffer
  await env.OAUTH_RESULTS.put(nonce, JSON.stringify(osuData), { expiration: exp / 1000 + 60 });

  return new Response(`Beautiful risings ${osuData.username}. You can safely return to Discord.`, {
    headers: { 'Content-Type': 'text/plain' },
  });
};

async function exchangeCode(env: Env, code: string): Promise<OAuthResultPayload | undefined> {
  // Exchange code for access token
  const res = await fetch('https://osu.ppy.sh/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: env.OSU_CLIENT_ID,
      client_secret: env.OSU_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: `${env.WORKER_URL}/callback`,
    }),
  });
  if (!res.ok) {
    console.log('yep');
    console.log(await res.json());
    return;
  }

  const accessCredentials = await res.json();
  if (!isAccessCredentials(accessCredentials)) {
    return;
  }

  const userRes = await fetch('https://osu.ppy.sh/api/v2/me', {
    headers: {
      Authorization: `Bearer ${accessCredentials.access_token}`,
    },
  });
  if (!userRes.ok) {
    return;
  }

  const osuUser = await userRes.json();
  if (!isOsuUser(osuUser)) {
    return;
  }

  return {
    osuId: osuUser.id,
    username: osuUser.username,
  };
}

function isAccessCredentials(obj: unknown): obj is { access_token: string } {
  return obj !== null && typeof obj === 'object' && 'access_token' in obj && typeof obj.access_token === 'string';
}

function isOsuUser(obj: unknown): obj is { id: number; username: string } {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    'id' in obj &&
    typeof obj.id === 'number' &&
    'username' in obj &&
    typeof obj.username === 'string'
  );
}
