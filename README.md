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
| `npm run test:e2e` | Playwright smoke tests against the live site (`PLAYWRIGHT_BASE_URL` overrides) |
| `npm run prepush` | **Run before every push:** lint + test + build |

CI (`.github/workflows/test.yml`) runs the same three steps on every push/PR.

## API (see `server.ts`)

| Endpoint | Purpose |
|---|---|
| `POST /api/orders/create` | Validated (zod) order intake. Rejects `400` without Name + Block or with an empty/malformed cart. Returns `orderId + trustTier`. Rate-limited (120 req/min/IP). |
| `POST /api/orders/verify-payment` | Razorpay HMAC check when `RAZORPAY_KEY_SECRET` is set; pilot stub otherwise (test mode only). |
| `POST /api/whatsapp/incoming` | `hi` → menu + QR link; holds KOT until Name + Block arrive. |
| `POST /api/whatsapp/send` | Max 2 templates/order (cost cap). |
| `POST /api/petpooja/save-order` | Real POS push when `PETPOOJA_*` env is set, pilot mock otherwise. |

## Staff login

Staff sections sit behind a cafe name + staff PIN. PINs live **server-side only** (`STAFF_PINS_JSON` env) — the client bundle contains no credentials. Sessions are HMAC-signed tokens (`STAFF_TOKEN_SECRET`) in `sessionStorage` with a 12h expiry, and `/api/staff/login` is rate-limited to 10 attempts/min/IP.

Local dev fallback PIN: `1234` (non-production only, with a console warning).

Production setup (Cloudflare Pages):

```powershell
$sec = -join ((1..32 | ForEach-Object { '{0:x2}' -f (Get-Random -Max 256) }))
@{ STAFF_TOKEN_SECRET = $sec
   STAFF_PINS_JSON = '{"zd-main":{"cafeName":"ZERO DEGREE CAFE","pin":"<SET-A-REAL-PIN>"}}' } | ConvertTo-Json | Out-File $env:TEMP\pe-secrets.json
npx wrangler pages secret bulk $env:TEMP\pe-secrets.json --project-name parallel-eats
Remove-Item $env:TEMP\pe-secrets.json -Force
# redeploy so the new secrets take effect
```

**Change the default PIN before giving the dashboard to staff.** Server-side accounts (Workers KV + hashed passwords) remain the upgrade path before selling.

## Security headers

 helmet (Express) + `public/_headers` (Pages) + Worker responses all send `nosniff` / `SAMEORIGIN` / strict referrer. CORS on the dev server allows localhost and `*.pages.dev` / `*.workers.dev` only. No CSP — the app relies on inline styles, which a strict policy would break.

## Staff queue persistence

Orders persist per device (`pe-staff-orders:v1`, capped at 100) so a refresh mid-rush loses nothing.

## Project layout

- `src/components/ZeroDegreeCustomerView.tsx` — student ordering page (College ID auto-fill, OPEN/CLOSED, sticky mobile order bar)
- `src/components/StaffQueueView.tsx` — kitchen queue, paid/unpaid, KOT push
- `src/components/QROrderView.tsx`, `WhatsAppFlowView.tsx` — QR + WhatsApp flows
- `src/components/SiteFooter.tsx` — footer with outlet info + section links
- `src/utils/savedProfiles.ts` — versioned localStorage profiles (`parallel-eats-profiles:v1`)
- `src/hooks/useTheme.ts` — dark/light mode, persisted
- `.opencode/skills/` — agent skills: `vercel-react-best-practices`, `web-design-guidelines`, `frontend-design`, `webapp-testing`

## Data (zero-cost, 10-lakh ready)

Hot data lives in Cloudflare D1 (`parallel-eats-db`, see `db/schema.sql`): slim customers/orders rows, staff accounts with salted PBKDF2 hashes (never plaintext), single-use reset codes, audit log. Free limits: 5M rows read/day, 100K writes/day, 500MB per DB — queries are indexed lookups only.

Cold history moves to R2/readable exports via `POST /api/admin/export` (staff token, outlet-scoped, CSV/JSONL download, 7+ day filter, 5K rows max) and `POST /api/admin/prune` (same filters + exact confirm phrase, batched deletes). Export first, prune second, verify the file — that loop keeps D1 lean forever.

Staff PIN reset is owner-assisted and free: signed-in staff opens Staff → PIN & Access → Generate reset code, reads the 6-digit single-use code to the colleague in person, who sets a new PIN within 15 minutes (`/api/staff/request-reset`, `/api/staff/complete-reset`). Nothing is sent by SMS/WhatsApp.

## Pilot rollout

1. Paper-form test (30 orders) → 2. one restaurant, 14 days → 3. other two outlets → 4. one small vendor → 5. sell packs. Payment gateway, Petpooja live push, and outside-delivery radius arrive on paid demand only.

## Environment

See `.env.example`. Only `RAZORPAY_KEY_SECRET` is used by the server today (enables real payment-signature checks).
