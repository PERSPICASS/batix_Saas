# Manual Testing Checklist

This document provides a comprehensive checklist for manual QA testing of the Batix SaaS application.

## Pre-Testing Setup

- [ ] Ensure development environment is running: `composer dev`
- [ ] Verify database is properly seeded: `php artisan migrate:fresh --seed`
- [ ] Check that both English and French language files are present
- [ ] Confirm all .env variables are set correctly
- [ ] Clear cache: `php artisan cache:clear`

## Authentication Testing

### User Registration

- [ ] User can register with valid email
- [ ] User can register with valid password (8+ chars)
- [ ] User cannot register with existing email (error message shown)
- [ ] User cannot register with weak password (error message shown)
- [ ] User can select language (FR/EN) during registration
- [ ] User's selected language is saved in database
- [ ] Confirmation email is sent after registration
- [ ] Registration page displays in correct language

### User Login

- [ ] User can login with correct email and password
- [ ] User cannot login with incorrect password (error message)
- [ ] User cannot login with non-existent email (error message)
- [ ] User is redirected to dashboard after successful login
- [ ] User's locale preference is applied after login
- [ ] "Remember me" checkbox works
- [ ] Login page displays in correct language

### Password Reset

- [ ] User can request password reset
- [ ] Password reset email is sent
- [ ] User can reset password with valid token
- [ ] Password reset token expires after time limit
- [ ] Old passwords are rejected after reset
- [ ] Password reset page displays in correct language

### Two-Factor Authentication (2FA)

- [ ] User can enable 2FA
- [ ] QR code is generated for authenticator app
- [ ] Backup codes are provided
- [ ] 2FA is required on login when enabled
- [ ] User can login with correct 2FA code
- [ ] User cannot login with incorrect 2FA code
- [ ] Backup codes work as fallback

### Email Verification

- [ ] Verification email is sent on registration
- [ ] User can verify email with link from email
- [ ] Verified users are marked as verified
- [ ] Unverified users cannot access certain features
- [ ] Resend verification email works

## Language and Locale Testing

### Language Switching

- [ ] User can switch from English to French
- [ ] User can switch from French to English
- [ ] Language preference is persisted in database
- [ ] Language preference persists across page reloads
- [ ] Language selector is visible on all pages
- [ ] Language preference is restored after logout/login

### Frontend Translation

#### Dashboard Page
- [ ] All text displays in correct language
- [ ] Date formats are localized (FR: dd/mm/yyyy, EN: mm/dd/yyyy)
- [ ] Number formats use correct decimal separator
- [ ] Currency displays correctly for locale
- [ ] All buttons have translated labels
- [ ] All tooltips display in correct language

#### Invoices
- [ ] Invoice list page displays in correct language
- [ ] Invoice detail page displays in correct language
- [ ] Invoice PDF has correct language content
- [ ] Translations match language files

#### Quotes
- [ ] Quote list displays in correct language
- [ ] Quote detail displays in correct language
- [ ] Quote PDF displays in correct language

#### Sales
- [ ] Sales list displays in correct language
- [ ] Sales create form displays in correct language
- [ ] Sales amounts and dates formatted correctly

### Email Translation

- [ ] Invoice email sent in French shows French content
- [ ] Invoice email sent in English shows English content
- [ ] Quote email sent in French shows French content
- [ ] Quote email sent in English shows English content
- [ ] Email subject is translated
- [ ] Email body is translated
- [ ] Email date/time is formatted per locale

## Multi-Tenancy Testing

### Shop Management

- [ ] User can create multiple shops
- [ ] User can see all their shops in shop switcher
- [ ] User can switch between shops
- [ ] Current shop is highlighted in switcher
- [ ] Each shop has separate data (invoices, quotes, sales)
- [ ] Shop switching updates dashboard to show shop-specific data

### Data Isolation

- [ ] User A's shop invoices don't appear in User B's dashboard
- [ ] User A cannot access User B's shop data
- [ ] Shop A's products don't appear in Shop B's product list
- [ ] Invoice created in Shop A only appears in Shop A
- [ ] Sales created in Shop A only appear in Shop A
- [ ] Quotes created in Shop A only appear in Shop A

### Shop Switching

- [ ] Shop switcher dropdown displays all user's shops
- [ ] Switching shops updates all data on page
- [ ] Shop preference is maintained after page refresh
- [ ] Shop preference is maintained after logout/login
- [ ] Dashboard shows data for currently selected shop

## Invoice Testing

### Invoice Creation

- [ ] User can create new invoice
- [ ] Invoice form displays all required fields
- [ ] User can add multiple line items
- [ ] Line item quantity and price are calculated correctly
- [ ] Subtotal is calculated from line items
- [ ] Tax is calculated correctly
- [ ] Discount is applied correctly
- [ ] Final total is accurate (subtotal - discount + tax)
- [ ] Invoice number is generated automatically
- [ ] Invoice date is set to current date
- [ ] Invoice status defaults to "draft"

### Invoice Editing

- [ ] User can edit draft invoice
- [ ] User can change invoice details
- [ ] User can modify line items
- [ ] Totals recalculate when amounts change
- [ ] Invoice cannot be edited if paid/sent (depends on workflow)
- [ ] Edit history is tracked

### Invoice Status Workflow

- [ ] Invoice can be created as "draft"
- [ ] Invoice can be marked as "sent"
- [ ] Invoice can be marked as "paid"
- [ ] Invoice can be marked as "cancelled"
- [ ] Status change is logged
- [ ] Previous status is preserved in history

### Invoice Payment

- [ ] User can record invoice payment
- [ ] Payment amount can be partial or full
- [ ] Payment date is recorded
- [ ] Payment method is recorded
- [ ] Payment status is updated
- [ ] Email is sent on payment receipt
- [ ] Invoice shows as "paid" when fully paid
- [ ] Invoice shows as "partially paid" when partial payment received

### Invoice Communication

- [ ] User can send invoice via email
- [ ] Invoice PDF is generated correctly
- [ ] PDF includes all invoice details
- [ ] PDF displays in correct language
- [ ] Email subject is translated
- [ ] Email body is translated
- [ ] Email is sent to correct recipient
- [ ] Email receipt is confirmed

## Quote Testing

### Quote Creation

- [ ] User can create new quote
- [ ] Quote form displays all required fields
- [ ] User can add multiple line items
- [ ] Calculations are correct (subtotal, tax, total)
- [ ] Quote number is generated automatically
- [ ] Quote has expiration date
- [ ] Quote status defaults to "pending"

### Quote Management

- [ ] User can edit quote before acceptance
- [ ] User can add/remove line items
- [ ] User can mark quote as "accepted"
- [ ] User can mark quote as "rejected"
- [ ] User can mark quote as "expired"

### Quote to Invoice Conversion

- [ ] User can convert accepted quote to invoice
- [ ] Invoice inherits quote details and amounts
- [ ] Invoice line items match quote items
- [ ] Original quote status changes to "converted"
- [ ] Invoice is created with correct status
- [ ] Invoice can be sent/paid after conversion

### Quote Communication

- [ ] User can send quote via email
- [ ] Quote PDF is generated correctly
- [ ] PDF displays in correct language
- [ ] Email contains quote details
- [ ] Email is sent to correct recipient

## Sales Testing

### Sale Creation

- [ ] User can create new sale
- [ ] Sale form displays all fields
- [ ] User can add line items
- [ ] Calculations are correct
- [ ] Sale can have discount
- [ ] Sale can have tax
- [ ] Final amount is accurate

### Payment Recording

- [ ] User can record full payment
- [ ] User can record partial payment
- [ ] Payment method is selectable (cash, card, transfer, etc.)
- [ ] Payment date is recorded
- [ ] Sale shows correct payment status
- [ ] Amount due is calculated correctly

### Sale Returns/Credits

- [ ] User can process return
- [ ] Return amount is credited back
- [ ] Credit can be applied to new sales
- [ ] Original sale shows return details

## Product Management

### Product CRUD

- [ ] User can create product
- [ ] User can view product list
- [ ] User can edit product
- [ ] User can delete product
- [ ] Product image can be uploaded
- [ ] Product SKU is unique
- [ ] Product can have multiple variants
- [ ] Product pricing is set correctly

### Product in Transactions

- [ ] Products can be added to invoices
- [ ] Products can be added to quotes
- [ ] Products can be added to sales
- [ ] Product prices are used in calculations
- [ ] Product quantities update inventory (if applicable)

## Settings and Preferences

### User Profile Settings

- [ ] User can update name
- [ ] User can update email
- [ ] User can update phone number
- [ ] Email verification is required for email change
- [ ] User can update profile picture
- [ ] Settings are saved correctly

### Language Preference

- [ ] User can set language preference to French
- [ ] User can set language preference to English
- [ ] Preference is remembered after logout/login
- [ ] All subsequent pages use saved preference
- [ ] Email communications use saved preference

### Business Settings (Shop Settings)

- [ ] User can set business name
- [ ] User can set business address
- [ ] User can set business phone
- [ ] User can set tax ID/VAT number
- [ ] User can set currency preference
- [ ] User can set default payment terms
- [ ] Settings are displayed on invoices/quotes

### Notification Settings

- [ ] User can enable/disable email notifications
- [ ] User can choose notification types
- [ ] Notifications respect user preferences
- [ ] Notification emails are sent in correct language

## API Testing

### Authentication

- [ ] API requires valid token
- [ ] Invalid token is rejected
- [ ] Token expiration works correctly
- [ ] User can refresh token

### Endpoints - Invoices

- [ ] GET /api/invoices returns user's invoices
- [ ] GET /api/invoices/:id returns invoice detail
- [ ] POST /api/invoices creates invoice
- [ ] PUT /api/invoices/:id updates invoice
- [ ] DELETE /api/invoices/:id deletes invoice
- [ ] Response format is correct JSON

### Endpoints - Quotes

- [ ] GET /api/quotes returns quotes
- [ ] POST /api/quotes creates quote
- [ ] PUT /api/quotes/:id updates quote
- [ ] Response includes all quote details

### Endpoints - Sales

- [ ] GET /api/sales returns sales
- [ ] POST /api/sales creates sale
- [ ] PUT /api/sales/:id updates sale
- [ ] Response includes payment information

### Response Format

- [ ] All API responses are valid JSON
- [ ] Error responses include error message
- [ ] Success responses include data
- [ ] HTTP status codes are correct
- [ ] Pagination works for list endpoints

## Email Testing

### Email Sending

- [ ] Emails are sent successfully (check mail logs)
- [ ] Email addresses are correct
- [ ] Email subject is appropriate
- [ ] Email body contains all necessary information

### Email Localization

- [ ] French user receives email in French
- [ ] English user receives email in English
- [ ] Email format is HTML and readable
- [ ] Email links work correctly

### Email Types

- [ ] Registration confirmation email works
- [ ] Password reset email works
- [ ] Invoice email works
- [ ] Quote email works
- [ ] Payment notification email works

## Payment Processing

### Payment Methods

- [ ] Cash payment can be recorded
- [ ] Card payment can be recorded
- [ ] Bank transfer can be recorded
- [ ] Cheque payment can be recorded
- [ ] Payment method is saved with transaction

### Payment Recording

- [ ] Full payment marks invoice/sale as paid
- [ ] Partial payment updates amount due
- [ ] Payment date is recorded correctly
- [ ] Payment references/notes are saved
- [ ] Payment receipt can be generated

## Permissions and Access Control

### Role-Based Access

- [ ] Admin can access admin panel
- [ ] Owner can manage shop
- [ ] Team member can view assigned data
- [ ] Guest cannot access protected pages

### Data Access

- [ ] User can only see their shop data
- [ ] User cannot access other user's shops
- [ ] User cannot access other user's invoices
- [ ] User cannot delete other user's data

## Reporting

### Invoice Reports

- [ ] User can generate invoice list report
- [ ] Report includes all invoices
- [ ] Report can be filtered by date range
- [ ] Report can be filtered by status
- [ ] Report can be exported to CSV/PDF
- [ ] Report displays in correct language

### Sales Reports

- [ ] User can generate sales report
- [ ] Report shows sales by period
- [ ] Report shows payment status
- [ ] Report can be exported

## Mobile Responsiveness

- [ ] Pages display correctly on mobile
- [ ] Forms are usable on mobile
- [ ] Navigation works on mobile
- [ ] Tables are readable on mobile
- [ ] Images scale correctly

## Performance

- [ ] Pages load in reasonable time (<3s)
- [ ] Invoices generate PDF quickly
- [ ] Reports generate quickly
- [ ] Search is responsive
- [ ] Filters work smoothly

## Security

- [ ] HTTPS is enforced
- [ ] CSRF protection is active
- [ ] SQL injection is prevented
- [ ] XSS attacks are prevented
- [ ] Session timeout works
- [ ] Password reset tokens expire
- [ ] Sensitive data is not logged

## Browser Compatibility

- [ ] Chrome latest version
- [ ] Firefox latest version
- [ ] Safari latest version
- [ ] Edge latest version
- [ ] Mobile browsers

## Database Integrity

- [ ] Invoice data is correct after operations
- [ ] Quote data is correct after operations
- [ ] Sale data is correct after operations
- [ ] Relationships are maintained
- [ ] Cascading deletes work correctly

## Post-Testing Steps

- [ ] Document any bugs found
- [ ] Screenshot failures for bug reports
- [ ] Run automated tests: `composer test`
- [ ] Verify no console errors
- [ ] Check application logs for errors
- [ ] Verify database is in consistent state
- [ ] Clear test data if needed

## Sign-Off

- [ ] All critical features tested
- [ ] All medium priority features tested
- [ ] Known issues documented
- [ ] Performance is acceptable
- [ ] Security checks passed
- [ ] Ready for release: [ ] YES [ ] NO

**Tested by**: _______________
**Date**: _______________
**Notes**: _______________
