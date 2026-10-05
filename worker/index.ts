import { onRequestPost as createOrder } from '../functions/api/orders/create';
import { onRequestPost as verifyPayment } from '../functions/api/orders/verify-payment';
import { onRequestPost as whatsappIncoming } from '../functions/api/whatsapp/incoming';
import { onRequestPost as whatsappSend } from '../functions/api/whatsapp/send';
import { onRequestPost as petpoojaSaveOrder } from '../functions/api/petpooja/save-order';
import { onRequestPost as voiceTurn } from '../functions/api/voice-agent/turn';
import { onRequestPost as voiceTts } from '../functions/api/voice-agent/tts';
import { onRequestPost as staffLogin } from '../functions/api/staff/login';
import { onRequestPost as staffVerify } from '../functions/api/staff/verify';
import { onRequestPost as staffRequestReset } from '../functions/api/staff/request-reset';
import { onRequestPost as staffCompleteReset } from '../functions/api/staff/complete-reset';
import { onRequestPost as adminExport } from '../functions/api/admin/export';
import { onRequestPost as adminPrune } from '../functions/api/admin/prune';
import type { PagesContext } from '../functions/_lib/api';

type Handler = (ctx: PagesContext) => Promise<Response> | Response;

const POST_ROUTES: Record<string, Handler> = {
  '/api/orders/create': createOrder,
  '/api/orders/verify-payment': verifyPayment,
  '/api/whatsapp/incoming': whatsappIncoming,
  '/api/whatsapp/send': whatsappSend,
  '/api/petpooja/save-order': petpoojaSaveOrder,
  '/api/voice-agent/turn': voiceTurn,
  '/api/voice-agent/tts': voiceTts,
  '/api/staff/login': staffLogin,
  '/api/staff/verify': staffVerify,
  '/api/staff/request-reset': staffRequestReset,
  '/api/staff/complete-reset': staffCompleteReset,
  '/api/admin/export': adminExport,
  '/api/admin/prune': adminPrune,
};

interface WorkerEnv {
  ASSETS?: { fetch: (req: Request | string) => Promise<Response> };
  RAZORPAY_KEY_SECRET?: string;
}

function errorJson(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  });
}

function withSecurityHeaders(res: Response): Response {
  const headers = new Headers(res.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'SAMEORIGIN');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);

    const handler = request.method === 'POST' ? POST_ROUTES[url.pathname] : undefined;
    if (handler) {
      try {
        return await handler({ request, env });
      } catch {
        return errorJson('Request failed', 500);
      }
    }

    // Static frontend (Vite dist). not_found_handling=single-page-application
    // in wrangler.toml already rewrites unknown paths to index.html.
    if (env.ASSETS) return withSecurityHeaders(await env.ASSETS.fetch(request));
    return errorJson('Not found', 404);
  },
};
