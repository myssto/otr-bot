import { type OAuthResultPayload, isOAuthStatePayload, OAUTH_ATTEMPT_TTL } from '@otr-discord-bot/shared';

export default {
  async fetch(req, env): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname !== '/callback') {
      return new Response('Not found', { status: 404 });
    }

    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code || !state) {
      return new Response('Invalid request.', { status: 400 });
    }

    // Decode and validate state
    let payload;
    try {
      payload = JSON.parse(atob(state));
      if (!isOAuthStatePayload(payload)) {
        throw new Error('Invalid state payload');
      }
    } catch {
      return new Response('Invalid request.', { status: 400 });
    }

    const { nonce, exp } = payload;
    if (Date.now() > exp) {
      return new Response('Authorization attempt took too long. Try again.');
    }

    // - EXCHANGE CODE FOR TOKEN
    // - USE TOKEN TO REQUEST USER

    const responseData: OAuthResultPayload = {
      osuId: 1,
      username: 'nuts',
    };

    // Temporarily store results in KV
    await env.OAUTH_RESULTS.put(nonce, JSON.stringify(responseData), { expirationTtl: OAUTH_ATTEMPT_TTL });

    return new Response(`Beautiful risings ${responseData.username}. You can safely return to Discord.`, {
      headers: { 'Content-Type': 'text/plain' },
    });
  },
} satisfies ExportedHandler<Env>;
