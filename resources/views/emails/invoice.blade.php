@component('mail::message')
# Facture {{ $invoice->invoice_number }}

Bonjour {{ $invoice->customer->name }},

Merci pour votre confiance. Veuillez trouver ci-joint votre facture n° **{{ $invoice->invoice_number }}** datée du {{ $invoice->invoice_date->format('d/m/Y') }}.

## Détails de la facture

| Description | Montant |
|-----------|---------|
| Sous-total | {{ number_format($invoice->subtotal, 2, ',', ' ') }} € |
| TVA | {{ number_format($invoice->tax_amount, 2, ',', ' ') }} € |
| **Total** | **{{ number_format($invoice->total, 2, ',', ' ') }} €** |

@if($invoice->notes)
## Notes
{{ $invoice->notes }}
@endif

## Informations de paiement

Modalités de paiement: À réception de la facture
Délai de paiement: {{ now()->diffInDays($invoice->due_date) }} jours

Si vous avez des questions, n'hésitez pas à nous contacter.

Cordialement,
**{{ $shopName }}**
@endcomponent
