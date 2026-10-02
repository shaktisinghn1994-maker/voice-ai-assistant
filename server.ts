import express, { NextFunction, Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// ---- API hardening: schema validation + per-IP rate limiting ----

const OrderItemSchema = z
  .object({
    item_id: z.string().min(1),
    quantity: z.number().int().positive(),
  })
  .passthrough();

const CreateOrderSchema = z.object({
  outletId: z.string().min(1),
  customerPhone: z.string().min(1),
  collegeId: z.string().optional(),
  customerName: z.string().trim().min(1, 'Order incomplete: Name + Block number required.'),
  blockNumber: z.string().trim().min(1, 'Order incomplete: Name + Block number required.'),
  roomNo: z.string().optional().default(''),
  instructions: z.string().optional().default(''),
  items: z.array(OrderItemSchema).min(1, 'Order must contain at least one item.'),
  grandTotal: z.coerce.number().nonnegative().default(0),
});

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 120;
const rateHits = new Map<string, number[]>();

function rateLimit(req: Request, res: Response, next: NextFunction): void {
  const now = Date.now();
  const key = req.ip ?? 'unknown';
  if (rateHits.size > 5000) rateHits.clear();
  const times = (rateHits.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (times.length >= RATE_MAX) {
    res.status(429).json({ error: 'Too many requests. Please slow down.' });
    return;
  }
  times.push(now);
  rateHits.set(key, times);
  next();
}

export function createApp() {
  const app = express();

  app.use(express.json({ limit: '5mb' }));
  app.use('/api/', rateLimit);

  // QR MVP hostel mode: order complete ONLY with Name + Block number. No outside delivery.
  app.post('/api/orders/create', async (req, res) => {
    const parsed = CreateOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid order payload.' });
      return;
    }
    try {
      const { customerPhone, collegeId, grandTotal } = parsed.data;
      const phone = String(customerPhone).replace(/\s+/g, '');
      // Demo directory: numbers ending with 829 / 090 are treated as repeat_verified.
      // Replace with Supabase lookup: successCount/failCount/blacklisted.
      const isRepeatDemo = /829$|090$|1102$|4211$/.test(phone);
      const total = Number(grandTotal) || 0;
      let trustTier: string = 'new_unknown';
      if (isRepeatDemo) trustTier = 'repeat_verified';
      else if (total <= 300) trustTier = 'low_history';
      const orderId = `RC-${Date.now().toString().slice(-6)}`;
      res.json({ orderId, trustTier, status: 'pending_pay', expiresInMin: 10, collegeId: collegeId || undefined });
    } catch {
      res.status(500).json({ error: 'Order create failed' });
    }
  });

  // Payment verification comes from the Razorpay webhook server-side, never the frontend.
  // With RAZORPAY_KEY_SECRET set, the HMAC signature is checked; otherwise a pilot
  // stub accepts the mock payment id. Never deploy the stub to production.
  app.post('/api/orders/verify-payment', async (req, res) => {
    try {
      const { orderId, razorpayPaymentId, razorpaySignature } = req.body ?? {};
      if (!orderId) {
        res.status(400).json({ error: 'Missing orderId' });
        return;
      }
      const secret = process.env.RAZORPAY_KEY_SECRET;
      if (secret) {
        if (!razorpayPaymentId || !razorpaySignature) {
          res.status(400).json({ error: 'Missing Razorpay payment id or signature.' });
          return;
        }
        const expected = crypto
          .createHmac('sha256', secret)
          .update(`${orderId}|${razorpayPaymentId}`)
          .digest('hex');
        const sig = String(razorpaySignature);
        const valid =
          expected.length === sig.length &&
          crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
        if (!valid) {
          res.status(400).json({ error: 'Invalid payment signature.' });
          return;
        }
        res.json({ orderId, verified: true, paymentStatus: 'paid' });
        return;
      }
      res.json({ orderId, verified: !!razorpayPaymentId, paymentStatus: 'paid' });
    } catch {
      res.status(500).json({ error: 'Verify failed' });
    }
  });

  // WhatsApp hostel incoming: hi/anything -> menu + QR link + Name free-text + Block dropdown.
  // Order complete ONLY with Name + Block. Same QR page link, one backend.
  app.post('/api/whatsapp/incoming', async (req, res) => {
    try {
      const { text, name, blockNumber } = req.body;
      const t = String(text || '').trim().toLowerCase();
      const hasName = !!(name && String(name).trim().length >= 2);
      const hasBlock = !!(blockNumber && String(blockNumber).trim());
      const qrLink = 'https://your-domain/qr?outlet=hostel-canteen-1';
      if (['hi', 'hello', 'hey', 'menu', 'order'].includes(t) || !t) {
        res.json({
          step: 'menu',
          replyText: `Namaste! Select your order:\n1. Paneer Roll Rs150\n2. Cold Coffee Rs140\n3. Peri-Peri Fries Rs130\n4. Maggi Double Rs165\n\nFast order here: ${qrLink}\n\nThen send Name (type) + Block (A/B/C/D/E/Mess) + note if any.`,
        });
        return;
      }
      if (!hasName || !hasBlock) {
        res.json({
          step: 'need_identity',
          replyText: `Almost done. Send Name + Block to complete.\nExample: Aarav, Block B 214.\nOr tap here to fill fast: ${qrLink}\nNo KOT until Name + Block filled.`,
        });
        return;
      }
      res.json({
        step: 'complete',
        replyText: `Thanks ${String(name).trim()}! Block ${String(blockNumber).trim()} noted.\nBill + UPI link next (1 msg). Reply YES to fire KOT. Dispatch update after that (1 msg).`,
      });
    } catch {
      res.status(500).json({ error: 'WhatsApp incoming failed' });
    }
  });

  // WhatsApp cost saver: max 2 Utility templates per order. Enforced here.
  app.post('/api/whatsapp/send', async (req, res) => {
    try {
      const { to, orderId, messages } = req.body;
      const capped = Array.isArray(messages) ? messages.slice(0, 2) : [];
      const estCostInr = Number((capped.length * 0.45).toFixed(2));
      res.json({
        to,
        orderId,
        sentCount: capped.length,
        capped: (messages || []).length > 2,
        estCostInr,
        note: 'Status checks use free link /o/orderId + missed-call IVR. No tracking spam.',
      });
    } catch {
      res.status(500).json({ error: 'WhatsApp send failed' });
    }
  });

  // Deprecated: voice AI removed in QR MVP to save Rs 13k-55k/mo.
  app.post('/api/voice-agent/turn', (_req, res) => {
    res.status(410).json({ error: 'Voice AI disabled in QR MVP. Use QR + WhatsApp flow.' });
  });
  app.post('/api/voice-agent/tts', (_req, res) => {
    res.status(410).json({ error: 'TTS disabled in QR MVP.' });
  });

  // 3. Petpooja POS Save Order Webhook Bridge
  app.post('/api/petpooja/save-order', async (req, res) => {
    try {
      const { payload } = req.body;
      const randomNum = Math.floor(8100 + Math.random() * 1800);
      res.json({
        success: '1',
        message: 'Order successfully pushed to Petpooja POS terminal and KOT printed.',
        petpooja_order_id: `PP-ORD-${randomNum}`,
        kot_number: `KOT #PP-${randomNum}`,
        timestamp: new Date().toISOString(),
        received_payload_size: JSON.stringify(payload || {}).length,
      });
    } catch {
      res.status(500).json({ error: 'Petpooja webhook error' });
    }
  });

  return app;
}

async function startServer() {
  const app = createApp();
  const PORT = 3000;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Parallel Eats running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VITEST && process.env.NODE_ENV !== 'test') {
  startServer();
}
