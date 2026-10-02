import { json } from '../../_lib/api';

export function onRequestPost(): Response {
  return json({ error: 'TTS disabled in QR MVP.' }, 410);
}
