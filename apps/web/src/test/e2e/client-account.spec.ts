import { expect, test } from '@playwright/test';

test.describe('Client Account Flow', () => {
  test.use({ storageState: 'tmp/client-auth.json' });

  test('view order history', async ({ page }) => {
    await page.goto('/conta/pedidos');

    await expect(page.locator('h1:has-text("Meus Pedidos")')).toBeVisible();
    await expect(page.locator('[data-testid="order-row"]')).toBeVisible();
  });

  test('view order details', async ({ page }) => {
    await page.goto('/conta/pedidos');

    await page.click('[data-testid="order-row"]:first-child >> a');

    await expect(page.locator('h1', { hasText: 'Pedido #' })).toBeVisible();
    await expect(page.locator('[data-testid="order-items"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-timeline"]')).toBeVisible();
  });

  test('manage addresses', async ({ page }) => {
    await page.goto('/conta/enderecos');

    await expect(page.locator('h1:has-text("Meus Endereços")')).toBeVisible();

    await page.click('button:has-text("Adicionar Endereço")');

    await page.fill('input[name="cep"]', '01000-000');
    await page.fill('input[name="logradouro"]', 'Rua Nova');
    await page.fill('input[name="numero"]', '456');
    await page.fill('input[name="bairro"]', 'Centro');
    await page.fill('input[name="cidade"]', 'São Paulo');
    await page.fill('input[name="uf"]', 'SP');

    await page.click('button:has-text("Salvar")');

    await expect(page.locator('text=Rua Nova, 456')).toBeVisible();
  });

  test('manage favorites', async ({ page }) => {
    await page.goto('/produtos');
    await page.click(
      '[data-testid="product-card"]:first-child >> button[aria-label="Adicionar aos favoritos"]'
    );

    await page.goto('/conta/favoritos');
    await expect(page.locator('[data-testid="favorite-item"]')).toBeVisible();
  });

  test('update profile', async ({ page }) => {
    await page.goto('/conta/perfil');

    await page.fill('input[name="nome_completo"]', 'Novo Nome Teste');
    await page.fill('input[name="telefone"]', '+5511888888888');

    await page.click('button:has-text("Salvar")');

    await expect(page.locator('text=Perfil atualizado')).toBeVisible();
  });

  test('password reset flow', async ({ page }) => {
    await page.goto('/login');
    await page.click('a:has-text("Esqueci minha senha")');

    await page.fill('input[name="email"]', 'client@e2e.test');
    await page.click('button:has-text("Enviar link de recuperação")');

    await expect(page.locator('text=Link de recuperação enviado')).toBeVisible();
  });
});
