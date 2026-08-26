import { test as setup } from '@playwright/test';

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/admin/login');
  await page.fill('input[name="email"]', 'admin@nextcommerce.com');
  await page.fill('input[name="password"]', 'admin123456');
  await page.click('button:has-text("Entrar")');
  
  await setup.context().storageState({ path: 'test-results/admin-auth.json' });
});

setup('authenticate as client', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'SenhaForte123!');
  await page.click('button:has-text("Entrar")');
  
  await setup.context().storageState({ path: 'test-results/client-auth.json' });
});