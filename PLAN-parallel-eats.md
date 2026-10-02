# Parallel Eats from Bharat Parallel - Saved Plan (2026-10-01)

## Brand
Product: Parallel Eats. Parent: Bharat Parallel. Display: Parallel Eats from Bharat Parallel.
Committed in: package.json, metadata.json, index.html, vite.config.ts, src/App.tsx header/footer, server.ts log + zip.

## Outlet pilot
ZERO DEGREE CAFE, G1 Block near Chief Warden Office, GHS Hostel, Manipal University Jaipur.
Phone: +91 82336 73311. Hours: 11 AM - 11 PM (configurable). Hostel only, no outside delivery.
Theme: black board + orange ribbon + brush headers, veg green / non-veg red dots. Customer page: src/components/ZeroDegreeCustomerView.tsx.

## Pilot menu (keep, add more later)
PIZZA full 12 with 7/11/16 + base note. COLD COFFEE 2. FRENCH FRIES 5.
Cake Price Varies = ask counter, no online order.

## Hostel ordering rule (locked)
Order complete ONLY with Name free-text + Block dropdown.
Blocks: Boys B1,B2,B3... Girls G1,G2... + Mess pickup. Plus Room + note.
QR scan and WhatsApp hi both open same link. WhatsApp hi -> menu buttons + QR link -> Name type + Block tap.
No KOT until Name + Block filled. Frontend + POST /api/orders/create both enforce (400 otherwise).

## Payment (now)
Outside app. Staff marks cash/UPI/card. No gateway, no commission, no webhook maintenance.
Future plugin: Razorpay verify + prepaid rule for new numbers.

## Staff
One queue sorted by Block for 3-4 staff batch runs. Verify paid-mark -> KOT -> Dispatched to Block gate.
OPEN/CLOSED toggle + auto hours + Busy-Pause. Closed page: We are closed now and not taking delivery orders.
In-progress orders finish, new blocked.

## WhatsApp cost rule
Max 2 Utility templates per order: bill+UPI+YES, dispatched+ETA. Status via free link /o/orderId + missed-call number. No tracking spam.

## Vendor mode (same core)
Vendor catalog price optional/blank allowed. Shop Name + unique SHOP code + phone OTP once. Order complete = Code + items + slot Morning/Evening. Cutoff 9pm. Due ledger per shop, block if over limit.
Test: 1 vendor <30 items, you as 1 shop for few days.

## Rollout
0) Paper Form test 30 orders. 1) 1 restaurant 14 days. 2) Other 2 restaurants. 3) Vendor small. 4) Sell packs. 5) Add payment/Petpooja/radius only on demand.

## Run after restart
1. Open folder C:\Users\t121\OneDrive\Desktop\cafevoice-ai-assistant
2. Run: npm install --legacy-peer-deps (only if node_modules missing)
3. Run: npm run dev
4. Open: http://localhost:3000 -> Customer Page tab
5. Dev server stops on restart, must rerun step 3.

## Server endpoints (QR MVP, voice disabled 410)
POST /api/orders/create (Name+Block enforced), POST /api/orders/verify-payment (stub, replace with Razorpay signature), POST /api/whatsapp/send (2-cap), POST /api/whatsapp/incoming (hi->menu+link), POST /api/petpooja/save-order (mock).
