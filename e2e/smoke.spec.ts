import { test, expect } from '@playwright/test';

// Live smoke tests against production. Run with:
//   npm run test:e2e
// Override target with PLAYWRIGHT_BASE_URL (e.g. a preview deployment).

test('customer page loads with category navigation', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Parallel Eats/);
  await expect(page.getByRole('group', { name: /Menu categories/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Show .*PIZZA.*12 items/ })).toBeVisible();
});

test('pizza icon narrows the menu to pizza only', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Show .*PIZZA.*12 items/ }).click();
  await expect(page.getByText('Classic Margarita (Plain Cheese)')).toBeVisible();
  await expect(page.getByText('Cold Coffee (Best Buy)')).toHaveCount(0);
});

test('staff login rejects a wrong PIN with guidance', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation', { name: 'App views' }).getByRole('button', { name: /Staff/ }).click();
  await page.getByLabel(/Staff PIN/).fill('wrong-pin');
  await page.getByRole('button', { name: /Open staff dashboard/ }).click();
  await expect(page.getByRole('alert')).toContainText(/current staff PIN/);
});

test('order API validation is live', async ({ request }) => {
  const res = await request.post('/api/orders/create', {
    data: { outletId: 'zd-main', customerPhone: '+91 1', customerName: '', blockNumber: '', items: [] },
  });
  expect(res.status()).toBe(400);
});

test('customer lookup misses cleanly for unknown numbers', async ({ request }) => {
  const res = await request.post('/api/customer/lookup', { data: { phone: '6000000001' } });
  expect(res.status()).toBe(200);
  expect(await res.json()).toEqual({ found: false });
});

test('ordering pops a thank-you dialog with the order', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Add one/ }).first().click();
  await page.getByPlaceholder(/e\.g\. Aarav/).fill('E2E Taster');
  await page.getByPlaceholder(/98765/).fill('9876500009');
  await page.locator('#zd-block').selectOption('G1');
  await page.getByRole('button', { name: /Place order/ }).first().click();
  await expect(page.getByRole('dialog', { name: /Order confirmed/ })).toBeVisible();
  await expect(page.getByText(/Thank you for ordering, E2E Taster!/)).toBeVisible();
});

test('staff live feed shares orders across devices', async ({ request }) => {  const login = await request.post('/api/staff/login', { data: { outletId: 'zd-main', pin: '1234' } });
  expect(login.status()).toBe(200);
  const { token } = await login.json();
  const feed = await request.get('/api/orders/live', { headers: { Authorization: `Bearer ${token}` } });
  expect(feed.status()).toBe(200);
  expect(Array.isArray((await feed.json()).orders)).toBe(true);

  const anon = await request.get('/api/orders/live');
  expect(anon.status()).toBe(401);
});
