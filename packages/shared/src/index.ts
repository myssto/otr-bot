/** TTL of an OAuth attempt. */
export const OAUTH_ATTEMPT_TTL = 600;

/** Contents of the encoded "state" parameter passed to osu! OAuth. */
export type OAuthStatePayload = {
  /** Unique UUID. */
  nonce: string;

  /** TTL of the auth attempt. */
  exp: number;
};

/** Type gaurd for {@link OAuthStatePayload} objects. */
export function isOAuthStatePayload(obj: unknown): obj is OAuthStatePayload {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    'nonce' in obj &&
    typeof obj.nonce === 'string' &&
    'exp' in obj &&
    typeof obj.exp === 'number'
  );
}

/** Data retrieved from osu! after a successful OAuth authorization. */
export type OAuthResultPayload = {
  /** osu! id. */
  osuId: number;

  /** osu! username. */
  username: string;
};

/** Type gaurd for {@link OAuthResultPayload} objects. */
export function isOAuthResultPayload(obj: unknown): obj is OAuthResultPayload {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    'osuId' in obj &&
    typeof obj.osuId === 'number' &&
    'username' in obj &&
    typeof obj.username === 'string'
  );
}
