import {
  hmacVerify,
  importHmacKey,
  SIG_HEADER,
  TIMESTAMP_HEADER,
  type OAuthStatusResponse,
} from '@otr-discord-bot/shared';
import { badRequest } from 'src/util';

export const statusHandler: ExportedHandlerFetchHandler<Env> = async (req, env) => {
  const url = new URL(req.url);
  const nonce = url.searchParams.get('nonce');

  if (!nonce) {
    return badRequest();
  }

  if (!(await verifyRequest(req, nonce, env))) {
    return new Response('Unauthorized', { status: 401 });
  }

  let response: OAuthStatusResponse = {
    complete: false,
  };

  const value = await env.OAUTH_RESULTS.get(nonce);
  if (!value) {
    return Response.json(response);
  }

  response = {
    complete: true,
    data: JSON.parse(value),
  };

  await env.OAUTH_RESULTS.delete(nonce);
  return Response.json(response);
};

async function verifyRequest(req: Request, nonce: string, env: Env): Promise<boolean> {
  const ts = req.headers.get(TIMESTAMP_HEADER);
  const sig = req.headers.get(SIG_HEADER);

  if (!ts || !sig) {
    return false;
  }

  const age = Math.abs(Date.now() - Number(ts));
  if (!Number.isFinite(age) || age > 30_000) {
    return false;
  }

  const key = await importHmacKey(env.BOT_SECRET);
  return hmacVerify(key, `${nonce}.${ts}`, sig);
}
