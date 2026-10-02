# Parallel Eats

QR + WhatsApp ordering for hostel restaurants and vendor supply. A Bharat Parallel product.

Pilot outlet: **Zero Degree Cafe**, G1 Block near Chief Warden Office, GHS Hostel, Manipal University Jaipur (+91 82336 73311, 11 AM – 11 PM).

Students scan a QR (or message `hi` on WhatsApp), pick items, add **Name + Block** — the order lands on one staff kitchen queue sorted by Block. No app download. Payment (cash/UPI/card) is marked by staff outside the app.

## Run locally

Prerequisites: Node.js 22+.

```bash
npm install --legacy-peer-deps
npm run dev        # Express + Vite on http://localhost:3000
```

Open `http://localhost:3000` → **Customer Page** tab is what the QR link opens.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` / `npm start` | Dev server (`tsx server.ts`) |
| `npm run build` | Production Vite build |
| `npm run lint` | `tsc --noEmit` (strict) + eslint |
| `npm run test` / `test:watch` | Vitest suite |
| `npm run prepush` | **Run before every push:** lint + test + build |

CI (`.github/workflows/test.yml`) runs the same three steps on every push/PR.

## API (see `server.ts`)

| Endpoint | Purpose |
|---|---|
| `POST /api/orders/create` | Validated (zod) order intake. Rejects `400` without Name + Block or with an empty/malformed cart. Returns `orderId + trustTier`. Rate-limited (120 req/min/IP). |
| `POST /api/orders/verify-payment` | Razorpay HMAC check when `RAZORPAY_KEY_SECRET` is set; pilot stub otherwise (test mode only). |
| `POST /api/whatsapp/incoming` | `hi` → menu + QR link; holds KOT until Name + Block arrive. |
| `POST /api/whatsapp/send` | Max 2 templates/order (cost cap). |
| `POST /api/petpooja/save-order` | POS bridge (mock in pilot). |

## Project layout

- `src/components/ZeroDegreeCustomerView.tsx` — student ordering page (College ID auto-fill, OPEN/CLOSED, sticky mobile order bar)
- `src/components/StaffQueueView.tsx` — kitchen queue, paid/unpaid, KOT push
- `src/components/QROrderView.tsx`, `WhatsAppFlowView.tsx` — QR + WhatsApp flows
- `src/components/SiteFooter.tsx` — footer with outlet info + section links
- `src/utils/savedProfiles.ts` — versioned localStorage profiles (`parallel-eats-profiles:v1`)
- `src/hooks/useTheme.ts` — dark/light mode, persisted
- `.opencode/skills/` — agent skills: `vercel-react-best-practices`, `web-design-guidelines`, `frontend-design`, `webapp-testing`

## Pilot rollout

1. Paper-form test (30 orders) → 2. one restaurant, 14 days → 3. other two outlets → 4. one small vendor → 5. sell packs. Payment gateway, Petpooja live push, and outside-delivery radius arrive on paid demand only.

## Environment

See `.env.example`. Only `RAZORPAY_KEY_SECRET` is used by the server today (enables real payment-signature checks).
