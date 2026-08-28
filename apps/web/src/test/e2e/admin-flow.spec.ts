import { expect, test } from '@playwright/test';

test.describe('Admin Flow', () => {
  test.use({ storageState: 'tmp/admin-auth.json' });

  test('admin login and dashboard access', async ({ page }) => {
    await page.goto('/admin/dashboard');

    await expect(page).toHaveURL('/admin/dashboard');
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();

    await expect(page.locator('text=Vendas Hoje')).toBeVisible();
    await expect(page.locator('text=Pedidos Pendentes')).toBeVisible();
  });

  test('view orders list and filter', async ({ page }) => {
    await page.goto('/admin/pedidos');

    await expect(page.locator('[data-testid="orders-table"]')).toBeVisible();

    await page.selectOption('select[name="status"]', 'PAGO');
    await expect(page.locator('[data-testid="order-row"]:first-child')).toContainText('PAGO');

    await page.selectOption('select[name="status"]', '');
  });

  test('view order details and change status', async ({ page }) => {
    await page.goto('/admin/pedidos');

    await page.click('[data-testid="order-row"]:first-child >> button:has-text("Ver detalhes")');

    await expect(page.locator('h1:has-text("Pedido #")')).toBeVisible();

    await page.selectOption('select[name="status"]', 'ENVIADO');
    await page.click('button:has-text("Atualizar status")');

    await expect(page.locator('text=ENVIADO')).toBeVisible();
  });

  test('admin logout', async ({ page }) => {
    await page.goto('/admin/dashboard');

    await page.click('[data-testid="user-menu"]');
    await page.click('button:has-text("Sair")');

    await expect(page).toHaveURL('/admin/login');
  });
});
