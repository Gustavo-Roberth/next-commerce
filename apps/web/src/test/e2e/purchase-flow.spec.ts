import { expect, test } from '@playwright/test';

test.describe('Purchase Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/produtos');
  });

  test('complete purchase flow - anonymous user', async ({ page }) => {
    // 1. Search for product
    await page.fill('input[type="search"]', 'camiseta');
    await page.press('input[type="search"]', 'Enter');

    // Wait for results
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });

    // 2. Click on first product
    await page.click('[data-testid="product-card"]:first-child');

    // 3. Select variation if needed
    const variationSelect = page.locator('select[name="variation"]');
    if (await variationSelect.isVisible()) {
      await variationSelect.selectOption({ index: 1 });
    }

    // 4. Add to cart
    await page.click('button:has-text("Adicionar ao carrinho")');

    // 5. Go to cart
    await page.click('[data-testid="cart-button"]');

    // 6. Verify cart contents
    await expect(page.locator('[data-testid="cart-item"]')).toBeVisible();

    // 7. Proceed to checkout
    await page.click('button:has-text("Finalizar compra")');

    // 7. Fill shipping address
    await page.fill('input[name="cep"]', '01000-000');
    await page.fill('input[name="logradouro"]', 'Rua Teste');
    await page.fill('input[name="numero"]', '123');
    await page.fill('input[name="bairro"]', 'Centro');
    await page.fill('input[name="cidade"]', 'São Paulo');
    await page.fill('input[name="uf"]', 'SP');

    // 8. Select shipping option
    await page.click('input[name="shipping"]:first-child');

    // 9. Select payment method (PIX)
    await page.click('input[name="payment-method"][value="pix"]');

    // 10. Submit order
    await page.click('button:has-text("Confirmar pedido")');

    // 11. Verify PIX QR code appears
    await expect(page.locator('[data-testid="pix-qr-code"]')).toBeVisible({ timeout: 10000 });

    // 12. Verify order confirmation
    await expect(page.locator('text=Pedido confirmado')).toBeVisible({ timeout: 10000 });
  });

  test('apply coupon in checkout', async ({ page }) => {
    await page.goto('/checkout');

    // Fill address first
    await page.fill('input[name="cep"]', '01000-000');
    await page.fill('input[name="logradouro"]', 'Rua Teste');
    await page.fill('input[name="numero"]', '123');
    await page.fill('input[name="bairro"]', 'Centro');
    await page.fill('input[name="cidade"]', 'São Paulo');
    await page.fill('input[name="uf"]', 'SP');

    // Apply coupon
    await page.fill('input[name="coupon"]', 'DESCONTO10');
    await page.click('button:has-text("Aplicar cupom")');

    // Verify discount applied
    await expect(page.locator('text=Desconto aplicado')).toBeVisible();
  });
});
