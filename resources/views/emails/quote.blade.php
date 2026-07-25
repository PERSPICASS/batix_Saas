@component('mail::message')
# {{ __('mail.quote.title', ['number' => $quote->quote_number]) }}

{{ __('mail.quote.greeting', ['salutation' => __('mail.common.salutation'), 'name' => $quote->customer->name]) }}

{{ __('mail.quote.intro', ['quoteNumber' => $quote->quote_number, 'quoteDate' => $quote->quote_date->format('d/m/Y')]) }}

## {{ __('mail.quote.details_title') }}

| {{ __('mail.quote.description') }} | {{ __('mail.quote.amount') }} |
|-----------|---------|
| {{ __('mail.quote.subtotal') }} | {{ number_format($quote->subtotal, 2, ',', ' ') }} {{ $currencySymbol }} |
| {{ __('mail.quote.tax') }} | {{ number_format($quote->tax_amount, 2, ',', ' ') }} {{ $currencySymbol }} |
| **{{ __('mail.quote.total') }}** | **{{ number_format($quote->total, 2, ',', ' ') }} {{ $currencySymbol }}** |

## {{ __('mail.quote.validity_title') }}

{{ __('mail.quote.validity_message', ['expiryDate' => $quote->expiry_date->format('d/m/Y')]) }}

@if($quote->notes)
## {{ __('mail.quote.notes_title') }}
{{ $quote->notes }}
@endif

@if($quote->terms)
## {{ __('mail.quote.terms_title') }}
{{ $quote->terms }}
@endif

{{ __('mail.quote.confirm_message') }}

{{ __('mail.quote.questions') }}

{{ __('mail.quote.signature') }}
**{{ $shopName }}**
@endcomponent
