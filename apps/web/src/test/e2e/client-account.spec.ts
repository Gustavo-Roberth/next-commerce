import { test, expect } from '@playwright/test';

test.describe('Client Account Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('user registration and email verification', async ({ page }) => {
    await page.goto('/registro');
    
    // Fill registration form
    await page.fill('input[name="email"]', `test${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'SenhaForte123!');
    await page.fill('input[name="confirmPassword"]', 'SenhaForte123!');
    await page.fill('input[name="nome_completo"]', 'Usuario Teste');
    await page.fill('input[name="telefone"]', '+5511999999999');
    
    await page.click('button:has-text("Cadastrar")');
    
    // Should redirect to email verification page
    await expect(page.locator('text=Verifique seu e-mail')).toBeVisible();
  });

  test('user login and dashboard access', async ({ page }) => {
    // First register a user via API or use existing
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'SenhaForte123!');
    await page.click('button:has-text("Entrar")');
    
    // Should redirect to account dashboard
    await expect(page).toHaveURL('/conta');
    await expect(page.locator('h1:has-text("Minha Conta")')).toBeVisible();
  });

  test('view order history', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'SenhaForte123!');
    await page.click('button:has-text("Entrar")');
    
    await page.goto('/conta/pedidos');
    
    await expect(page.locator('h1:has-text("Meus Pedidos")')).toBeVisible();
    await expect(page.locator('[data-testid="order-row"]')).toBeVisible();
  });

  test('view order details', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'SenhaForte123!');
    await page.click('button:has-text("Entrar")');
    await page.click('button:has-text("Entrar")');
    
    await page.goto('/conta/pedidos');
    
    // Click on first order
    await page.click('[data-testid="order-row"]:first-child >> a');
    
// Verify order details
    await expect(page.locator('h1', { hasText: 'Pedido #' })).toBeVisible();
    await expect(page.locator('[data-testid="order-items"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-timeline"]')).toBeVisible();
  });

  test('manage addresses', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'SenhaForte123!');
    await page.click('button:has-text("Entrar")');
    
    await page.goto('/conta/enderecos');
    
    await expect(page.locator('h1:has-text("Meus Endereços")')).toBeVisible();
    
    // Add new address
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
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'SenhaForte123!');
    await page.click('button:has-text("Entrar")');
    
    // Go to product and add to favorites
    await page.goto('/produtos');
    await page.click('[data-testid="product-card"]:first-child >> button[aria-label="Adicionar aos favoritos"]');
    
    // Check favorites page
    await page.goto('/conta/favoritos');
    await expect(page.locator('[data-testid="favorite-item"]')).toBeVisible();
  });

  test('update profile', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'SenhaForte123!');
    await page.click('button:has-text("Entrar")');
    
    await page.goto('/conta/perfil');
    
    await page.fill('input[name="nome_completo"]', 'Novo Nome Teste');
    await page.fill('input[name="telefone"]', '+5511888888888');
    
    await page.click('button:has-text("Salvar")');
    
    await expect(page.locator('text=Perfil atualizado')).toBeVisible();
  });

  test('password reset flow', async ({ page }) => {
    await page.goto('/login');
    await page.click('a:has-text("Esqueci minha senha")');
    
await page.fill('input[name="email"]', 'test@example.com');
        await page.click('button:has-text("Enviar link de recuperação")');
    
    await expect(page.locator('text=Link de recuperação enviado')).toBeVisible();
  });
});