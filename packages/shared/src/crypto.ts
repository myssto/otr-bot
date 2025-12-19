const encoder = new TextEncoder();

export async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ]);
}

export async function hmacSign(key: CryptoKey, message: string): Promise<string> {
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return Buffer.from(sig).toString('base64url');
}

export async function hmacVerify(key: CryptoKey, message: string, signature: string): Promise<boolean> {
  return crypto.subtle.verify('HMAC', key, Buffer.from(signature, 'base64url'), encoder.encode(message));
}

export function toBase64url(str: string): string {
  return Buffer.from(str).toString('base64url');
}

export function fromBase64url(str: string): string {
  return Buffer.from(str, 'base64url').toString();
}
