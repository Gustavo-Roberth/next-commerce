import { expect, test } from '@playwright/test';

// Smoke de staging/prod. So executa quando STAGING_WEB_URL esta definido,
// para nao rodar acidentalmente no suite local de E2E.
const WEB_URL = process.env.STAGING_WEB_URL || '';
const API_URL = process.env.STAGING_API_URL || '';
const runSmoke = Boolean(WEB_URL);

test.describe('Smoke — Staging', () => {
  test.skip(!runSmoke, 'Requer STAGING_WEB_URL definido');

  test('home carrega', async ({ page }) => {
    const res = await page.goto(WEB_URL);
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator('#conteudo')).toBeVisible();
  });

  test('API /ready responde', async ({ request }) => {
    const res = await request.get(`${API_URL}/ready`);
    expect(res.ok()).toBeTruthy();
  });

  test('login de cliente funciona', async ({ page }) => {
    await page.goto(`${WEB_URL}/login`);
    await page.locator('input[type=email]').fill('client@e2e.test');
    await page.locator('input[type=password]').fill('Client@123');
    await page.getByRole('button', { name: /entrar|acessar|login/i }).click();
    await expect(page).toHaveURL(/\/(conta|produtos)/);
  });

  test('listagem de produtos acessivel', async ({ page }) => {
    const res = await page.goto(`${WEB_URL}/produtos`);
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator('#conteudo')).toBeVisible();
  });
});
