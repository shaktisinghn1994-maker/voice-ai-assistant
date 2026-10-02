import { json } from '../../_lib/api';

export function onRequestPost(): Response {
  return json({ error: 'Voice AI disabled in QR MVP. Use QR + WhatsApp flow.' }, 410);
}
