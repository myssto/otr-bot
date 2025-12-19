/**
 * Creates a default 400 response.
 * @param message Optional response.
 * @returns A response with status 400 (bad request).
 */
export const badRequest = (message?: string) => new Response(message ?? 'Bad request', { status: 400 });
