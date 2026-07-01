import { test, expect } from '@playwright/test';

test.describe('Invoice Workflow', () => {
  const BASE_URL = process.env.APP_URL || 'http://localhost';

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(`${BASE_URL}/dashboard`);
  });

  test('user can create new invoice', async ({ page }) => {
    await page.goto(`${BASE_URL}/invoices`);

    // Click create button
    await page.click('button:has-text("Create Invoice")');

    // Fill invoice details
    await page.fill('input[name="amount"]', '5000');
    await page.fill('textarea[name="notes"]', 'Test invoice');

    // Submit form
    await page.click('button:has-text("Create")');

    // Should redirect to invoice detail
    await expect(page).toHaveURL(/\/invoices\/\d+/);

    // Should show success message
    const successMessage = page.locator('[role="alert"]:has-text("created")');
    await expect(successMessage).toBeVisible();
  });

  test('user can add line items to invoice', async ({ page }) => {
    // Navigate to create invoice
    await page.goto(`${BASE_URL}/invoices/create`);

    // Add first item
    await page.click('button:has-text("Add Item")');
    await page.fill('input[name="items[0][description]"]', 'Product A');
    await page.fill('input[name="items[0][quantity]"]', '2');
    await page.fill('input[name="items[0][unit_price]"]', '1000');

    // Add second item
    await page.click('button:has-text("Add Item")');
    await page.fill('input[name="items[1][description]"]', 'Product B');
    await page.fill('input[name="items[1][quantity]"]', '3');
    await page.fill('input[name="items[1][unit_price]"]', '500');

    // Submit
    await page.click('button:has-text("Create")');

    // Verify on invoice detail page
    await expect(page).toHaveURL(/\/invoices\/\d+/);

    // Should see both items
    const items = page.locator('[data-testid="invoice-item"]');
    await expect(items).toHaveCount(2);
  });

  test('user can send invoice via email', async ({ page }) => {
    // Go to existing invoice
    await page.goto(`${BASE_URL}/invoices/1`);

    // Click send button
    await page.click('button:has-text("Send")');

    // Should show email form
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toBeVisible();

    // Fill email if needed
    if (await emailInput.inputValue() === '') {
      await page.fill('input[name="email"]', 'customer@example.com');
    }

    // Send
    await page.click('button:has-text("Send Email")');

    // Should show success message
    const successMessage = page.locator('[role="status"]:has-text("sent")');
    await expect(successMessage).toBeVisible();
  });

  test('user can record payment', async ({ page }) => {
    // Go to invoice
    await page.goto(`${BASE_URL}/invoices/1`);

    // Click record payment
    await page.click('button:has-text("Record Payment")');

    // Fill payment details
    await page.fill('input[name="amount"]', '5000');
    await page.selectOption('select[name="payment_method"]', 'credit_card');

    // Submit
    await page.click('button:has-text("Record")');

    // Should show success
    const successMessage = page.locator('[role="status"]');
    await expect(successMessage).toContainText('recorded');
  });

  test('user can download invoice PDF', async ({ page }) => {
    await page.goto(`${BASE_URL}/invoices/1`);

    // Click download button
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Download PDF")');

    // Wait for download to complete
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/invoice.*\.pdf/i);
  });

  test('invoice calculations are correct', async ({ page }) => {
    await page.goto(`${BASE_URL}/invoices/create`);

    // Add item: quantity 2, price 1000 = 2000
    await page.click('button:has-text("Add Item")');
    await page.fill('input[name="items[0][quantity]"]', '2');
    await page.fill('input[name="items[0][unit_price]"]', '1000');

    // Check subtotal
    const subtotal = page.locator('[data-testid="subtotal"]');
    await expect(subtotal).toContainText('2000');

    // Add tax (assume 10%)
    await page.fill('input[name="tax_rate"]', '10');

    // Check tax amount
    const taxAmount = page.locator('[data-testid="tax-amount"]');
    await expect(taxAmount).toContainText('200');

    // Check total (2000 + 200)
    const total = page.locator('[data-testid="total"]');
    await expect(total).toContainText('2200');
  });

  test('user can apply discount', async ({ page }) => {
    await page.goto(`${BASE_URL}/invoices/create`);

    // Add item
    await page.click('button:has-text("Add Item")');
    await page.fill('input[name="items[0][unit_price]"]', '1000');

    // Apply discount
    await page.fill('input[name="discount_amount"]', '100');

    // Check updated total
    const total = page.locator('[data-testid="total"]');
    await expect(total).toContainText('900');
  });

  test('invoice displays in correct language', async ({ page }) => {
    // Set to French
    await page.click('button[data-testid="language-switcher"]');
    await page.click('button:has-text("Français")');

    // Navigate to invoices
    await page.goto(`${BASE_URL}/invoices`);

    // Check for French text
    const heading = page.locator('h1');
    await expect(heading).toContainText(/factures|invoices/i);
  });
});
