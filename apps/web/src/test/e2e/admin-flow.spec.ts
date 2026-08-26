import { test, expect } from '@playwright/test';

test.describe('Admin Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/login');
  });

  test('admin login and dashboard access', async ({ page }) => {
    // Login as admin
    await page.fill('input[name="email"]', 'admin@nextcommerce.com');
    await page.fill('input[name="password"]', 'admin123456');
    await page.click('button:has-text("Entrar")');
    
    // Wait for dashboard
    await expect(page).toHaveURL('/admin/dashboard');
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
    
    // Verify KPIs are visible
    await expect(page.locator('text=Vendas Hoje')).toBeVisible();
    await expect(page.locator('text=Pedidos Pendentes')).toBeVisible();
  });

  test('view orders list and filter', async ({ page }) => {
    await page.goto('/admin/login');
    await page.fill('input[name="email"]', 'admin@nextcommerce.com');
    await page.fill('input[name="password"]', 'admin123456');
    await page.click('button:has-text("Entrar")');
    
    await page.goto('/admin/pedidos');
    
    // Verify orders list loads
    await expect(page.locator('[data-testid="orders-table"]')).toBeVisible();
    
    // Filter by status
    await page.selectOption('select[name="status"]', 'PAGO');
    await expect(page.locator('[data-testid="order-row"]:first-child')).toContainText('PAGO');
    
    // Clear filter
    await page.selectOption('select[name="status"]', '');
  });

  test('view order details and change status', async ({ page }) => {
    await page.goto('/admin/login');
    await page.fill('input[name="email"]', 'admin@nextcommerce.com');
    await page.fill('input[name="password"]', 'admin123456');
    await page.click('button:has-text("Entrar")');
    
    await page.goto('/admin/pedidos');
    
    // Click on first order
    await page.click('[data-testid="order-row"]:first-child >> button:has-text("Ver detalhes")');
    
    // Verify order details page
    await expect(page.locator('h1:has-text("Pedido #")')).toBeVisible();
    
    // Change status
    await page.selectOption('select[name="status"]', 'ENVIADO');
    await page.click('button:has-text("Atualizar status")');
    
    // Verify status updated
    await expect(page.locator('text=ENVIADO')).toBeVisible();
  });

  test('admin logout', async ({ page }) => {
    await page.goto('/admin/login');
    await page.fill('input[name="email"]', 'admin@nextcommerce.com');
    await page.fill('input[name="password"]', 'admin123456');
    await page.click('button:has-text("Entrar")');
    
    await page.click('[data-testid="user-menu"]');
    await page.click('button:has-text("Sair")');
    
    await expect(page).toHaveURL('/admin/login');
  });
});