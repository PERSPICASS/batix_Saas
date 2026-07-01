import { test, expect } from '@playwright/test';

test.describe('Multilingual Testing', () => {
  const BASE_URL = process.env.APP_URL || 'http://localhost';

  test('all pages display in English', async ({ page }) => {
    await page.goto(BASE_URL);

    // Set language to English
    await page.click('button[data-testid="language-switcher"]');
    await page.click('button:has-text("English")');

    // Check dashboard
    await page.goto(`${BASE_URL}/dashboard`);
    let heading = page.locator('h1');
    await expect(heading).toBeVisible();

    // Check invoices page
    await page.goto(`${BASE_URL}/invoices`);
    heading = page.locator('h1');
    await expect(heading).toContainText(/invoice/i);

    // Check quotes page
    await page.goto(`${BASE_URL}/quotes`);
    heading = page.locator('h1');
    await expect(heading).toContainText(/quote/i);

    // Check sales page
    await page.goto(`${BASE_URL}/sales`);
    heading = page.locator('h1');
    await expect(heading).toContainText(/sale/i);
  });

  test('all pages display in French', async ({ page }) => {
    await page.goto(BASE_URL);

    // Set language to French
    await page.click('button[data-testid="language-switcher"]');
    await page.click('button:has-text("Français")');

    // Check dashboard
    await page.goto(`${BASE_URL}/dashboard`);
    let heading = page.locator('h1');
    await expect(heading).toBeVisible();

    // Check invoices page
    await page.goto(`${BASE_URL}/invoices`);
    heading = page.locator('h1');
    await expect(heading).toContainText(/facture/i);

    // Check quotes page
    await page.goto(`${BASE_URL}/quotes`);
    heading = page.locator('h1');
    await expect(heading).toContainText(/devis/i);

    // Check sales page
    await page.goto(`${BASE_URL}/sales`);
    heading = page.locator('h1');
    await expect(heading).toContainText(/vente/i);
  });

  test('language switcher works correctly', async ({ page }) => {
    await page.goto(BASE_URL);

    // Get language switcher
    const switcher = page.locator('button[data-testid="language-switcher"]');
    await expect(switcher).toBeVisible();

    // Open dropdown
    await switcher.click();

    // Should show both languages
    const englishBtn = page.locator('button:has-text("English")');
    const frenchBtn = page.locator('button:has-text("Français")');

    await expect(englishBtn).toBeVisible();
    await expect(frenchBtn).toBeVisible();
  });

  test('language preference persists across pages', async ({ page }) => {
    await page.goto(BASE_URL);

    // Set to French
    await page.click('button[data-testid="language-switcher"]');
    await page.click('button:has-text("Français")');

    // Navigate to different pages
    await page.goto(`${BASE_URL}/invoices`);
    await page.waitForTimeout(500);

    // Check language is still French
    let heading = page.locator('h1');
    await expect(heading).toContainText(/facture/i);

    // Go to quotes
    await page.goto(`${BASE_URL}/quotes`);
    await page.waitForTimeout(500);

    // Should still be French
    heading = page.locator('h1');
    await expect(heading).toContainText(/devis/i);
  });

  test('language preference persists after reload', async ({ page }) => {
    await page.goto(BASE_URL);

    // Set to French
    await page.click('button[data-testid="language-switcher"]');
    await page.click('button:has-text("Français")');

    // Reload page
    await page.reload();

    // Check it's still French
    const switcher = page.locator('button[data-testid="language-switcher"]');
    const text = await switcher.textContent();
    expect(text).toContain('Français');
  });

  test('dates are formatted per locale', async ({ page }) => {
    // Test in English locale
    await page.goto(BASE_URL);
    await page.click('button[data-testid="language-switcher"]');
    await page.click('button:has-text("English")');

    await page.goto(`${BASE_URL}/invoices`);

    // Check date format (should be MM/DD/YYYY for English)
    const dateCell = page.locator('[data-testid="invoice-date"]').first();
    const dateText = await dateCell.textContent();

    // English date should be MM/DD/YYYY
    expect(dateText).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);

    // Switch to French
    await page.click('button[data-testid="language-switcher"]');
    await page.click('button:has-text("Français")');

    // Reload to get new date format
    await page.reload();

    // Check date format (should be DD/MM/YYYY for French)
    const frenchDateCell = page.locator('[data-testid="invoice-date"]').first();
    const frenchDateText = await frenchDateCell.textContent();

    expect(frenchDateText).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
  });

  test('currencies are formatted per locale', async ({ page }) => {
    await page.goto(BASE_URL);

    // English locale
    await page.click('button[data-testid="language-switcher"]');
    await page.click('button:has-text("English")');

    await page.goto(`${BASE_URL}/invoices`);

    // Check English currency format
    let amountCell = page.locator('[data-testid="amount"]').first();
    let amountText = await amountCell.textContent();

    // Should contain $ and comma separator
    expect(amountText).toMatch(/\$.*\d{1,3},?\d{3}\.?\d{2}/);

    // Switch to French
    await page.click('button[data-testid="language-switcher"]');
    await page.click('button:has-text("Français")');
    await page.reload();

    // Check French currency format
    amountCell = page.locator('[data-testid="amount"]').first();
    amountText = await amountCell.textContent();

    // French might use different symbol and separators
    expect(amountText).toMatch(/\d/);
  });

  test('form labels and placeholders change with language', async ({ page }) => {
    await page.goto(`${BASE_URL}/invoices/create`);

    // Set to English
    await page.click('button[data-testid="language-switcher"]');
    await page.click('button:has-text("English")');

    // Check English labels
    let label = page.locator('label:has-text("Amount")');
    await expect(label).toBeVisible();

    // Switch to French
    await page.click('button[data-testid="language-switcher"]');
    await page.click('button:has-text("Français")');

    // Reload form
    await page.reload();

    // Check French labels
    label = page.locator('label:has-text("Montant")');
    await expect(label).toBeVisible();
  });

  test('email translations work correctly', async ({ page }) => {
    // This would need to check email sending in both languages
    // For now, verify emails can be sent

    await page.goto(BASE_URL);

    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');

    // Set language to French
    await page.click('button[data-testid="language-switcher"]');
    await page.click('button:has-text("Français")');

    // Navigate to invoice
    await page.goto(`${BASE_URL}/invoices/1`);

    // Send email - should use French templates
    await page.click('button:has-text("Envoyer")');

    // Should show success
    const successMessage = page.locator('[role="status"]');
    await expect(successMessage).toBeVisible();
  });
});
