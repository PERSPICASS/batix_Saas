import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  const BASE_URL = process.env.APP_URL || 'http://localhost';

  test('user can login with valid credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    // Fill email
    await page.fill('input[name="email"]', 'user@example.com');

    // Fill password
    await page.fill('input[name="password"]', 'password');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(`${BASE_URL}/dashboard`);
  });

  test('user cannot login with invalid password', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    const errorMessage = page.locator('[role="alert"]');
    await expect(errorMessage).toBeVisible();
  });

  test('user can register with valid data', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);

    const email = `test-${Date.now()}@example.com`;

    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'password123456');
    await page.fill('input[name="password_confirmation"]', 'password123456');

    // Select language
    await page.selectOption('select[name="locale"]', 'en');

    await page.click('button[type="submit"]');

    // Should redirect or show confirmation
    await expect(page).toHaveURL(`${BASE_URL}/dashboard`);
  });

  test('user can logout', async ({ page, context }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    await expect(page).toHaveURL(`${BASE_URL}/dashboard`);

    // Click logout
    await page.click('button:has-text("Logout")');

    // Should redirect to login
    await expect(page).toHaveURL(`${BASE_URL}/login`);
  });

  test('user can reset password', async ({ page }) => {
    await page.goto(`${BASE_URL}/forgot-password`);

    const email = 'user@example.com';
    await page.fill('input[name="email"]', email);
    await page.click('button[type="submit"]');

    // Should show success message
    const successMessage = page.locator('[role="status"]');
    await expect(successMessage).toContainText('password reset');
  });

  test('user can enable 2FA', async ({ page }) => {
    // This test requires being logged in
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');

    // Go to settings
    await page.goto(`${BASE_URL}/settings/security`);

    // Click enable 2FA
    await page.click('button:has-text("Enable 2FA")');

    // Should show QR code
    const qrCode = page.locator('img[alt="QR Code"]');
    await expect(qrCode).toBeVisible();
  });

  test('user can login with 2FA', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');

    // Should show 2FA prompt
    const twoFaInput = page.locator('input[name="code"]');
    await expect(twoFaInput).toBeVisible();

    // Note: In real test, this would use TOTP library to generate code
    await page.fill('input[name="code"]', '000000');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(`${BASE_URL}/dashboard`);
  });

  test('user stays on login page if not authenticated', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);

    // Should redirect to login
    await expect(page).toHaveURL(`${BASE_URL}/login`);
  });
});
