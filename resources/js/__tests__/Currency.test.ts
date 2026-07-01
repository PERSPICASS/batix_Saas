import { describe, it, expect } from 'vitest';

/**
 * Test suite for currency formatting utilities
 */
describe('Currency Formatting', () => {
  /**
   * Test formatting amount in English locale
   */
  it('should format currency in English locale', () => {
    const amount = 1234.56;
    const locale = 'en';

    // Format as currency: $1,234.56
    const formatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD',
    }).format(amount);

    expect(formatted).toContain('1,234');
    expect(formatted).toContain('56');
  });

  /**
   * Test formatting amount in French locale
   */
  it('should format currency in French locale', () => {
    const amount = 1234.56;
    const locale = 'fr';

    // Format as currency: 1 234,56 €
    const formatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);

    expect(formatted).toContain('1');
    expect(formatted).toContain('234');
  });

  /**
   * Test formatting zero amount
   */
  it('should format zero correctly', () => {
    const amount = 0;
    const formatted = new Intl.NumberFormat('en', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);

    expect(formatted).toContain('0');
  });

  /**
   * Test formatting negative amount
   */
  it('should format negative amount with minus sign', () => {
    const amount = -100;
    const formatted = new Intl.NumberFormat('en', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);

    expect(formatted).toContain('-');
    expect(formatted).toContain('100');
  });

  /**
   * Test formatting large amount
   */
  it('should format large amounts correctly', () => {
    const amount = 1000000.99;
    const formatted = new Intl.NumberFormat('en', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);

    expect(formatted).toContain('1,000,000');
  });

  /**
   * Test percentage formatting
   */
  it('should format percentage correctly', () => {
    const value = 0.15;
    const formatted = new Intl.NumberFormat('en', {
      style: 'percent',
    }).format(value);

    expect(formatted).toContain('15');
  });

  /**
   * Test decimal places
   */
  it('should format with correct decimal places', () => {
    const amount = 10;
    const formatted = new Intl.NumberFormat('en', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

    expect(formatted).toContain('10.00');
  });
});
