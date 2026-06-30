@component('mail::message')
# Devis {{ $quote->quote_number }}

Bonjour {{ $quote->customer->name }},

Veuillez trouver ci-joint notre devis n° **{{ $quote->quote_number }}** datée du {{ $quote->quote_date->format('d/m/Y') }}.

## Détails du devis

| Description | Montant |
|-----------|---------|
| Sous-total | {{ number_format($quote->subtotal, 2, ',', ' ') }} € |
| TVA | {{ number_format($quote->tax_amount, 2, ',', ' ') }} € |
| **Total** | **{{ number_format($quote->total, 2, ',', ' ') }} €** |

## Validité du devis

Ce devis est valable jusqu'au **{{ $quote->expiry_date->format('d/m/Y') }}**.

@if($quote->notes)
## Notes
{{ $quote->notes }}
@endif

@if($quote->terms)
## Conditions commerciales
{{ $quote->terms }}
@endif

Pour confirmer votre accord et passer commande, veuillez nous faire parvenir ce devis signé ou simplement nous le confirmer par email.

Si vous avez des questions, n'hésitez pas à nous contacter.

Cordialement,
**{{ $shopName }}**
@endcomponent
