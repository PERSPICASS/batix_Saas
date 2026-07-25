@component('mail::message')
# {{ __('mail.invoice.title', ['number' => $invoice->invoice_number]) }}

{{ __('mail.invoice.greeting', ['salutation' => __('mail.common.salutation'), 'name' => $invoice->customer->name]) }}

{{ __('mail.invoice.intro', ['invoiceNumber' => $invoice->invoice_number, 'invoiceDate' => $invoice->invoice_date->format('d/m/Y')]) }}

## {{ __('mail.invoice.details_title') }}

| {{ __('mail.invoice.description') }} | {{ __('mail.invoice.amount') }} |
|-----------|---------|
| {{ __('mail.invoice.subtotal') }} | {{ number_format($invoice->subtotal, 2, ',', ' ') }} {{ $currencySymbol }} |
| {{ __('mail.invoice.tax') }} | {{ number_format($invoice->tax_amount, 2, ',', ' ') }} {{ $currencySymbol }} |
| **{{ __('mail.invoice.total') }}** | **{{ number_format($invoice->total, 2, ',', ' ') }} {{ $currencySymbol }}** |

@if($invoice->notes)
## {{ __('mail.invoice.notes_title') }}
{{ $invoice->notes }}
@endif

## {{ __('mail.invoice.payment_info_title') }}

{{ __('mail.invoice.payment_terms') }}
{{ __('mail.invoice.payment_due_days', ['days' => now()->diffInDays($invoice->due_date)]) }}

{{ __('mail.invoice.questions') }}

{{ __('mail.invoice.signature') }}
**{{ $shopName }}**
@endcomponent
