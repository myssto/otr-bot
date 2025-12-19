import { callbackHandler } from './routes/callback';
import { statusHandler } from './routes/status';

export default {
  async fetch(...args): Promise<Response> {
    const url = new URL(args[0].url);
    switch (url.pathname) {
      case '/callback':
        return callbackHandler(...args);
      case '/status':
        return statusHandler(...args);
      default:
        return new Response('Not found', { status: 404 });
    }
  },
} satisfies ExportedHandler<Env>;
