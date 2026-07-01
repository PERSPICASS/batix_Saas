# Complete Testing Protocol for Batix SaaS

## Table of Contents
1. [Testing Philosophy](#testing-philosophy)
2. [Test Structure](#test-structure)
3. [Setup Instructions](#setup-instructions)
4. [Running Tests](#running-tests)
5. [Coverage Requirements](#coverage-requirements)
6. [Best Practices](#best-practices)
7. [CI/CD Integration](#cicd-integration)

## Testing Philosophy

This SaaS application follows a comprehensive testing strategy:

- **Unit Tests**: Test individual components and utilities in isolation
- **Feature Tests**: Test complete workflows and user interactions
- **Integration Tests**: Test how components work together
- **E2E Tests**: Test complete user journeys
- **API Tests**: Test API endpoints and responses

### Testing Goals

1. Ensure code quality and reliability
2. Catch regressions early
3. Document expected behavior
4. Enable confident refactoring
5. Maintain >80% code coverage

## Test Structure

### Directory Organization

```
tests/
├── Unit/                           # Unit tests
│   ├── UserLocaleTest.php
│   ├── EmailTranslationTest.php
│   ├── InvoiceCalculationTest.php
│   ├── QuoteValidationTest.php
│   ├── PaymentProcessingTest.php
│   └── DiscountCalculationTest.php
├── Feature/                        # Feature and integration tests
│   ├── Auth/
│   │   ├── AuthenticationTest.php
│   │   └── [other auth tests]
│   ├── MultiLanguageTest.php
│   ├── InvoiceWorkflowTest.php
│   ├── QuoteToInvoiceTest.php
│   ├── EmailSendingTest.php
│   ├── MultiTenancyTest.php
│   ├── PermissionTest.php
│   ├── SalesTest.php
│   ├── SettingsTest.php
│   └── APITest.php
├── e2e/                           # End-to-end tests
│   ├── auth.spec.ts
│   ├── products.spec.ts
│   ├── sales.spec.ts
│   ├── quotes.spec.ts
│   ├── invoices.spec.ts
│   ├── multilingual.spec.ts
│   ├── multitenancy.spec.ts
│   └── email-sending.spec.ts
└── TestCase.php                   # Base test case class
```

## Setup Instructions

### Prerequisites

- PHP 8.2+
- Node.js 18+
- Composer
- npm

### Backend Testing Setup

```bash
# Install PHP dependencies
composer install

# Copy environment for testing (if needed)
cp .env.example .env.testing

# Generate app key
php artisan key:generate --env=testing

# Install frontend dependencies
npm install
```

### Database Setup for Tests

Tests use an in-memory SQLite database by default. This is configured in `phpunit.xml`:

```xml
<env name="DB_CONNECTION" value="sqlite"/>
<env name="DB_DATABASE" value=":memory:"/>
```

## Running Tests

### Run All Tests

```bash
# Using composer script
composer test

# Or directly
php artisan test
```

### Run Specific Test Suites

```bash
# Run only unit tests
composer test:unit
# or
php artisan test tests/Unit

# Run only feature tests
composer test:feature
# or
php artisan test tests/Feature

# Run tests matching pattern
php artisan test tests/Feature/MultiLanguageTest.php
```

### Run with Coverage Report

```bash
# Generate coverage report
php artisan test --coverage

# Generate coverage report with HTML
php artisan test --coverage --coverage-html=coverage-report
```

### Run Tests in Watch Mode

Tests will automatically run when files change:

```bash
php artisan test --watch
```

### Run with Verbose Output

```bash
php artisan test --verbose
```

### Run Specific Test Method

```bash
php artisan test tests/Feature/MultiLanguageTest.php::test_user_can_switch_languages
```

## Frontend Testing (Vitest)

### Setup Vitest

```bash
npm install -D vitest @vitest/ui happy-dom
```

### Run Frontend Tests

```bash
# Run all tests
npm run test

# Run in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Open UI dashboard
npm run test:ui
```

## E2E Testing Setup

### Setup Playwright

```bash
npm install -D @playwright/test

# Install browsers
npx playwright install
```

### Run E2E Tests

```bash
# Run all E2E tests
npx playwright test

# Run specific file
npx playwright test tests/e2e/auth.spec.ts

# Run in UI mode (recommended for development)
npx playwright test --ui

# Run with headed browser (see what's happening)
npx playwright test --headed
```

## Coverage Requirements

### Target Coverage Levels

- **Unit Tests**: 90%+ coverage required
- **Feature Tests**: 85%+ coverage required
- **Overall**: 80%+ code coverage

### View Coverage Report

```bash
# View coverage after test run
open coverage-report/index.html
```

### Coverage Goals by Component

| Component | Target | Priority |
|-----------|--------|----------|
| Models | 90% | High |
| Controllers | 85% | High |
| Services | 85% | High |
| Middleware | 80% | Medium |
| Helpers | 80% | Medium |

## Best Practices

### Test Organization

1. **One assertion per test** (when possible)
   - Makes test failures more obvious
   - Easier to debug

2. **Clear test names**
   - Use `test_` prefix
   - Describe what is being tested
   - Example: `test_user_can_switch_languages`

3. **Arrange-Act-Assert pattern**
   ```php
   // Arrange - Set up test data
   $user = User::factory()->create();
   
   // Act - Perform the action
   $user->update(['locale' => 'fr']);
   
   // Assert - Verify the result
   $this->assertEquals('fr', $user->fresh()->locale);
   ```

### Test Data

1. **Use Factories** for creating test data
   ```php
   $user = User::factory()->create(['locale' => 'en']);
   ```

2. **Keep tests isolated** - Each test should be independent
3. **Clean up after tests** - Use `tearDown()` for cleanup

### Mocking and Stubbing

1. **Mock external services**
   ```php
   Mail::fake();
   ```

2. **Stub methods when needed**
   ```php
   $this->mock(PaymentService::class)
       ->shouldReceive('process')
       ->andReturn(true);
   ```

### Testing Multilingual Features

1. Test both French and English locales
2. Verify translation keys are used
3. Test locale switching
4. Test email translation per user locale

### Testing Multi-Tenancy

1. Verify data isolation between shops
2. Test shop switching
3. Test ownership checks
4. Verify invoices/quotes belong to correct shop

## CI/CD Integration

### GitHub Actions Workflow

Tests run automatically on:
- Push to any branch
- Pull requests
- Scheduled daily builds

### Workflow File

Location: `.github/workflows/tests.yml`

Runs:
1. PHP Unit and Feature Tests
2. Frontend Component Tests
3. E2E Tests (on schedule)
4. Coverage report generation

### Test Status Checks

Pull requests require passing tests before merge:
- All tests must pass
- Coverage must meet thresholds
- No critical security issues

## Debugging Failed Tests

### View Detailed Output

```bash
php artisan test --verbose
```

### Debug Single Test

```bash
# Run with debugging
php artisan test tests/Feature/MultiLanguageTest.php::test_user_can_switch_languages -vvv
```

### Use Ray for Debugging

```php
// In your test
ray($user)->blue();
ray('Debug message')->red();
```

### Common Issues

| Issue | Solution |
|-------|----------|
| Database migration fails | Run `php artisan migrate:refresh --seed` |
| Factory not found | Check `database/factories/` directory |
| Locale not found | Verify translation files exist in `lang/` |
| Mail not sending in tests | Use `Mail::fake()` |
| Auth failing | Check `TestCase` base class setup |

## Test Checklist Before Deployment

- [ ] All unit tests pass
- [ ] All feature tests pass
- [ ] All E2E tests pass
- [ ] Code coverage meets 80% threshold
- [ ] No failing tests in CI/CD pipeline
- [ ] No deprecated function warnings
- [ ] No security vulnerabilities detected
- [ ] Frontend tests pass
- [ ] Database migrations run successfully
- [ ] API endpoints return correct responses

## Performance Considerations

### Fast Test Execution

1. Use in-memory SQLite for unit/feature tests
2. Avoid external API calls - use mocks
3. Run tests in parallel when possible
4. Cache test data when appropriate

### Optimization Tips

```bash
# Run tests in parallel (if using Pest)
composer test -- --parallel

# Skip slow tests during development
php artisan test --exclude-group=slow

# Use --stop-on-failure to stop at first failure
php artisan test --stop-on-failure
```

## Resources

- [Laravel Testing Documentation](https://laravel.com/docs/testing)
- [PHPUnit Documentation](https://docs.phpunit.de/)
- [Playwright Documentation](https://playwright.dev/)
- [Vitest Documentation](https://vitest.dev/)

## Contributing to Tests

When adding new features:

1. Write tests first (TDD approach recommended)
2. Follow existing test patterns
3. Ensure new tests pass locally
4. Maintain or improve code coverage
5. Update this documentation if needed

## Questions?

For questions about testing strategy, refer to:
- Test files for examples
- `tests/README.md` for structure details
- `tests/TEST_CHECKLIST.md` for manual QA
