# Test Structure and Guidelines

This document describes the organization and structure of tests in the Batix SaaS application.

## Directory Structure

```
tests/
├── Unit/                              # Unit tests - Test isolated components
│   ├── UserLocaleTest.php             # User locale functionality
│   ├── EmailTranslationTest.php       # Email translation logic
│   ├── InvoiceCalculationTest.php     # Invoice amount calculations
│   ├── QuoteValidationTest.php        # Quote validation rules
│   ├── PaymentProcessingTest.php      # Payment logic
│   ├── DiscountCalculationTest.php    # Discount calculations
│   └── ShopHelperTest.php             # Shop helper functions
│
├── Feature/                           # Feature tests - Test workflows
│   ├── Auth/
│   │   ├── AuthenticationTest.php     # Login/logout workflows
│   │   ├── EmailVerificationTest.php  # Email verification
│   │   ├── PasswordResetTest.php      # Password reset flow
│   │   ├── PasswordUpdateTest.php     # Change password
│   │   └── RegistrationTest.php       # User registration
│   │
│   ├── MultiLanguageTest.php          # FR/EN language switching
│   ├── InvoiceWorkflowTest.php        # Complete invoice workflow
│   ├── QuoteToInvoiceTest.php         # Quote to invoice conversion
│   ├── EmailSendingTest.php           # Email sending in locale
│   ├── MultiTenancyTest.php           # Shop isolation and switching
│   ├── PermissionTest.php             # Access control
│   ├── SalesTest.php                  # Sales creation and payment
│   ├── SettingsTest.php               # User settings and preferences
│   ├── APITest.php                    # API endpoints
│   └── ...other tests
│
├── e2e/                               # End-to-end tests (Playwright)
│   ├── auth.spec.ts                   # Login, register, logout, 2FA
│   ├── products.spec.ts               # Product CRUD operations
│   ├── sales.spec.ts                  # Sales creation and workflow
│   ├── quotes.spec.ts                 # Quote creation and conversion
│   ├── invoices.spec.ts               # Invoice creation and payment
│   ├── multilingual.spec.ts           # Testing both FR and EN
│   ├── multitenancy.spec.ts           # Shop switching
│   └── email-sending.spec.ts          # Email sending flow
│
└── TestCase.php                       # Base test case class
```

## Test Naming Conventions

### Unit Tests

Pattern: `test_<feature>_<behavior>`

Examples:
- `test_user_has_default_locale`
- `test_invoice_subtotal_calculation`
- `test_discount_validation`

### Feature Tests

Pattern: `test_<action>_<result>`

Examples:
- `test_user_can_switch_languages`
- `test_invoice_created_successfully`
- `test_shop_isolation_enforced`

### E2E Tests

Pattern: `<action>.<scenario>`

Examples:
- `login.with-valid-credentials`
- `invoice.create-and-send`
- `quote.convert-to-invoice`

## Writing Unit Tests

Unit tests focus on individual functions/methods in isolation.

### Basic Structure

```php
<?php

namespace Tests\Unit;

use App\Models\User;
use Tests\TestCase;

class UserLocaleTest extends TestCase
{
    /**
     * Test that user has default locale
     */
    public function test_user_has_default_locale(): void
    {
        // Arrange
        $user = User::factory()->create();

        // Assert
        $this->assertNotNull($user->locale);
        $this->assertIn($user->locale, ['en', 'fr']);
    }
}
```

### Characteristics

- Test one thing per test method
- No database interactions if possible
- Mock external dependencies
- Fast execution (< 100ms ideal)
- Isolated from other tests

## Writing Feature Tests

Feature tests test workflows and user interactions.

### Basic Structure

```php
<?php

namespace Tests\Feature;

use App\Models\Shop;
use App\Models\User;
use Tests\TestCase;

class MultiLanguageTest extends TestCase
{
    /**
     * Test that user can switch between French and English
     */
    public function test_user_can_switch_languages(): void
    {
        // Arrange
        $user = User::factory()->create(['locale' => 'en']);
        $this->actingAs($user);

        // Act
        $user->update(['locale' => 'fr']);

        // Assert
        $this->assertEquals('fr', $user->fresh()->locale);
    }
}
```

### Characteristics

- Test complete user workflows
- Use database (in-memory SQLite)
- Test HTTP requests and responses
- Test authentication and authorization
- Test data persistence
- Slower than unit tests (acceptable: 1-5s)

## Writing E2E Tests

End-to-end tests simulate real user interactions in the browser.

### Basic Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('user can login with valid credentials', async ({ page }) => {
    // Arrange
    await page.goto('http://localhost/login');
    
    // Act
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Assert
    await expect(page).toHaveURL('http://localhost/dashboard');
  });
});
```

### Characteristics

- Full browser automation
- Test real user workflows
- Validate UI interactions
- Slowest tests (acceptable: 5-30s each)
- Should be limited in number (critical paths only)

## Using Factories

Factories generate test data quickly and consistently.

### Creating Records

```php
// Create single record
$user = User::factory()->create();

// Create with specific attributes
$user = User::factory()->create([
    'locale' => 'fr',
    'email' => 'test@example.com'
]);

// Create multiple records
$users = User::factory()->count(5)->create();

// Create without saving (for testing)
$user = User::factory()->make();
```

### Available Factories

- `User::factory()` - Create test users
- `Shop::factory()` - Create test shops
- `Invoice::factory()` - Create test invoices
- `Quote::factory()` - Create test quotes
- `Sale::factory()` - Create test sales
- And more in `database/factories/`

## Mocking and Stubbing

### Mock Mail Service

```php
use Illuminate\Support\Facades\Mail;

public function test_email_sent(): void
{
    Mail::fake();
    
    // ... do something that sends email
    
    Mail::assertSent(InvoiceMail::class);
}
```

### Mock HTTP Requests

```php
use Illuminate\Support\Facades\Http;

public function test_external_api_call(): void
{
    Http::fake([
        'api.example.com/*' => Http::response(['status' => 'ok']),
    ]);
    
    // ... test code
}
```

### Mock Services

```php
$mock = $this->mock(PaymentService::class)
    ->shouldReceive('process')
    ->with(100)
    ->andReturn(true);
```

## Assertions

### Common Assertions

```php
// Database assertions
$this->assertDatabaseHas('users', ['email' => 'test@example.com']);
$this->assertDatabaseMissing('users', ['email' => 'deleted@example.com']);

// Object assertions
$this->assertEquals('fr', $user->locale);
$this->assertNull($user->deleted_at);
$this->assertTrue($user->is_active);

// Collection assertions
$this->assertCount(3, $users);
$this->assertEmpty($items);

// Response assertions (HTTP tests)
$response->assertStatus(200);
$response->assertJson(['success' => true]);
$response->assertRedirect('/dashboard');
```

## Setup and Teardown

### Using setUp and tearDown

```php
class InvoiceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        // Run before each test
        Mail::fake();
    }

    protected function tearDown(): void
    {
        // Run after each test
        parent::tearDown();
    }
}
```

### Using setUpBeforeClass

```php
public static function setUpBeforeClass(): void
{
    // Run once before all tests in class
}
```

## Testing Authentication

### Acting As User

```php
$user = User::factory()->create();

// HTTP tests
$this->actingAs($user)->get('/dashboard')->assertStatus(200);

// API tests
$this->actingAs($user, 'sanctum')->getJson('/api/invoices')->assertStatus(200);
```

### Testing Unauthorized Access

```php
// Not authenticated
$this->get('/dashboard')->assertRedirect('/login');

// Wrong user
$user1 = User::factory()->create();
$user2 = User::factory()->create();
$shop = Shop::factory()->create(['user_id' => $user1->id]);

$this->actingAs($user2)
    ->get("/shops/{$shop->id}")
    ->assertStatus(403);
```

## Testing Multilingual Features

### Test Both Locales

```php
public function test_invoice_in_french(): void
{
    $user = User::factory()->create(['locale' => 'fr']);
    $this->actingAs($user);
    
    // Test French functionality
}

public function test_invoice_in_english(): void
{
    $user = User::factory()->create(['locale' => 'en']);
    $this->actingAs($user);
    
    // Test English functionality
}
```

### Test Translation Keys

```php
public function test_translation_keys_exist(): void
{
    $french = trans('invoices', [], 'fr');
    $english = trans('invoices', [], 'en');
    
    $this->assertIsArray($french);
    $this->assertIsArray($english);
}
```

## Testing Multi-Tenancy

### Test Shop Isolation

```php
public function test_invoice_isolation(): void
{
    $user = User::factory()->create();
    $shop1 = Shop::factory()->create(['user_id' => $user->id]);
    $shop2 = Shop::factory()->create(['user_id' => $user->id]);
    
    $invoice1 = Invoice::factory()->create(['shop_id' => $shop1->id]);
    $invoice2 = Invoice::factory()->create(['shop_id' => $shop2->id]);
    
    // Verify isolation
    $this->assertEquals($shop1->id, $invoice1->shop_id);
    $this->assertNotEquals($shop1->id, $invoice2->shop_id);
}
```

## Best Practices Summary

1. **One assertion per test** (when possible)
2. **Clear test names** that describe behavior
3. **Arrange-Act-Assert** pattern
4. **Use factories** for test data
5. **Mock external dependencies**
6. **Keep tests isolated**
7. **Test both success and failure cases**
8. **Test edge cases**
9. **Maintain >80% code coverage**
10. **Run tests frequently during development**

## Debugging Tests

### Enable Detailed Output

```bash
php artisan test --verbose
```

### Use dd() for Debugging

```php
public function test_user_locale(): void
{
    $user = User::factory()->create();
    dd($user->locale); // Dump and die
}
```

### Use ray() for Debugging

```php
public function test_user_locale(): void
{
    $user = User::factory()->create();
    ray($user)->blue();
    // View in Ray app
}
```

## Performance Tips

1. Use in-memory SQLite (default)
2. Mock external services
3. Use factories wisely (avoid N+1 queries)
4. Run tests in parallel when possible
5. Cache test data when appropriate
6. Skip slow tests during development: `php artisan test --exclude-group=slow`

## Continuous Improvement

- Review test failures to improve test quality
- Refactor tests along with code
- Keep test documentation updated
- Monitor code coverage trends
- Add tests for bugs before fixing
- Celebrate and maintain test achievements

For more information, see [TESTING.md](../TESTING.md) at the project root.
