{{--
    Ticket de caisse, format ruban 80 mm.

    Pas de mise en page en colonnes flottantes : dompdf les rend mal sur un support étroit.
    Tout passe par des tableaux, seule construction qu'il compose de façon fiable.
--}}
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <style>
        @page { margin: 6pt; }
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 8pt;
            color: #000;
            margin: 0;
        }
        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: bold; }
        .shop-name { font-size: 11pt; font-weight: bold; }
        .muted { color: #444; font-size: 7pt; }
        .rule { border-top: 1px dashed #000; margin: 5pt 0; }
        table { width: 100%; border-collapse: collapse; }
        td { vertical-align: top; padding: 1pt 0; }
        .totals td { padding: 1pt 0; }
        .grand td { font-size: 10pt; font-weight: bold; padding-top: 3pt; }
        .cancelled {
            border: 1pt solid #000;
            padding: 3pt;
            text-align: center;
            font-weight: bold;
            margin-bottom: 4pt;
        }
    </style>
</head>
<body>

@if ($sale->status === 'cancelled')
    {{-- Un ticket annulé peut avoir été imprimé avant de l'être : le dire explicitement
         évite qu'il circule comme une pièce valide. --}}
    <div class="cancelled">VENTE ANNULÉE</div>
@endif

<div class="center">
    <div class="shop-name">{{ $shop?->name }}</div>
    @if ($shop?->address)
        <div class="muted">{{ $shop->address }}@if ($shop->city), {{ $shop->city }}@endif</div>
    @endif
    @if ($shop?->phone)
        <div class="muted">Tél. {{ $shop->phone }}</div>
    @endif
    @if ($shop?->tax_id)
        <div class="muted">N° fiscal : {{ $shop->tax_id }}</div>
    @endif
</div>

<div class="rule"></div>

<table>
    <tr>
        <td>Ticket</td>
        <td class="right bold">{{ $sale->ticket_number }}</td>
    </tr>
    <tr>
        <td>Date</td>
        <td class="right">{{ $sale->sale_date?->format('d/m/Y H:i') }}</td>
    </tr>
    @if ($sale->customer)
        <tr>
            <td>Client</td>
            <td class="right">{{ $sale->customer->name }}</td>
        </tr>
    @endif
    @if ($sale->user)
        <tr>
            <td>Vendeur</td>
            <td class="right">{{ $sale->user->name }}</td>
        </tr>
    @endif
</table>

<div class="rule"></div>

<table>
    @foreach ($sale->items as $item)
        <tr>
            <td colspan="2">{{ $item->product_name }}</td>
        </tr>
        <tr>
            <td class="muted">
                {{ $item->quantity }} × {{ number_format($item->unit_price, 2, ',', ' ') }}
            </td>
            <td class="right">{{ number_format($item->total, 2, ',', ' ') }}</td>
        </tr>
    @endforeach
</table>

<div class="rule"></div>

<table class="totals">
    <tr>
        <td>Sous-total</td>
        <td class="right">{{ number_format($sale->subtotal, 2, ',', ' ') }} {{ $currencySymbol }}</td>
    </tr>
    @if ($sale->tax_amount > 0)
        <tr>
            <td>TVA</td>
            <td class="right">{{ number_format($sale->tax_amount, 2, ',', ' ') }} {{ $currencySymbol }}</td>
        </tr>
    @endif
    @if ($sale->discount_amount > 0)
        <tr>
            <td>Remise</td>
            <td class="right">-{{ number_format($sale->discount_amount, 2, ',', ' ') }} {{ $currencySymbol }}</td>
        </tr>
    @endif
    <tr class="grand">
        <td>TOTAL</td>
        <td class="right">{{ number_format($sale->total, 2, ',', ' ') }} {{ $currencySymbol }}</td>
    </tr>
</table>

<div class="rule"></div>

<table>
    <tr>
        <td>Payé</td>
        <td class="right">{{ number_format($sale->amount_paid, 2, ',', ' ') }} {{ $currencySymbol }}</td>
    </tr>
    @if ($sale->change_amount > 0)
        <tr>
            <td>Rendu</td>
            <td class="right">{{ number_format($sale->change_amount, 2, ',', ' ') }} {{ $currencySymbol }}</td>
        </tr>
    @endif
    @if ($sale->remaining_amount > 0)
        {{-- Vente à crédit : le reste dû doit figurer sur le ticket que le client emporte. --}}
        <tr>
            <td class="bold">Reste dû</td>
            <td class="right bold">{{ number_format($sale->remaining_amount, 2, ',', ' ') }} {{ $currencySymbol }}</td>
        </tr>
        @if ($sale->credit_due_date)
            <tr>
                <td>Échéance</td>
                <td class="right">{{ $sale->credit_due_date->format('d/m/Y') }}</td>
            </tr>
        @endif
    @endif
</table>

<div class="rule"></div>

<div class="center muted">
    @if ($shop?->invoice_footer)
        <div>{{ $shop->invoice_footer }}</div>
    @endif
    <div>Merci de votre visite</div>
</div>

</body>
</html>
