@extends('pdf.layouts.document')

@section('title', __('documents.purchase_order'))
@section('number', $purchase->reference)

@section('meta')
    <div class="muted">{{ __('documents.date') }} : {{ $purchase->order_date?->format('d/m/Y') }}</div>
    @if ($purchase->expected_date)
        <div class="muted">{{ __('documents.expected_date') }} : {{ $purchase->expected_date->format('d/m/Y') }}</div>
    @endif
    @if ($purchase->status === 'cancelled')
        <div class="bold">{{ __('documents.cancelled') }}</div>
    @endif
@endsection

@section('party-label', __('documents.supplier'))

@section('party')
    <div class="bold">{{ $purchase->supplier?->company_name ?: $purchase->supplier?->name }}</div>
    @if ($purchase->supplier?->company_name && $purchase->supplier?->name)
        <div class="muted">{{ $purchase->supplier->name }}</div>
    @endif
    @if ($purchase->supplier?->address || $purchase->supplier?->city)
        <div class="muted">{{ trim($purchase->supplier->address . ' ' . $purchase->supplier->city) }}</div>
    @endif
    @if ($purchase->supplier?->phone || $purchase->supplier?->mobile)
        <div class="muted">{{ __('documents.phone') }} {{ $purchase->supplier->phone ?: $purchase->supplier->mobile }}</div>
    @endif
    @if ($purchase->supplier?->email)
        <div class="muted">{{ $purchase->supplier->email }}</div>
    @endif
    @if ($purchase->supplier?->tax_id)
        <div class="muted">{{ __('documents.tax_id') }} : {{ $purchase->supplier->tax_id }}</div>
    @endif
@endsection

@section('lines')
    {{-- Comme le devis : show_unit_prices masque le prix unitaire, show_amounts tout ce qui
         est un montant. TVA et remise n'ont de sens qu'à côté d'un prix : sans prix ni
         montants, le bon devient une liste de quantités à chiffrer par le fournisseur.
         La colonne remise n'apparaît que si une ligne en porte une. --}}
    @php
        $showUnitPrices = $purchase->show_unit_prices ?? true;
        $showAmounts = $purchase->show_amounts ?? true;
        $showRates = $showUnitPrices || $showAmounts;
        $hasDiscount = $showRates && $purchase->items->contains(fn ($item) => (float) $item->discount_amount > 0);
    @endphp
    <table class="lines">
        <thead>
            <tr>
                <th>{{ __('documents.description') }}</th>
                <th class="right" style="width: 9%;">{{ __('documents.quantity') }}</th>
                @if ($showUnitPrices)
                    <th class="right" style="width: 15%;">{{ __('documents.unit_price_excl') }}</th>
                @endif
                @if ($hasDiscount)
                    <th class="right" style="width: 10%;">{{ __('documents.discount') }}</th>
                @endif
                @if ($showRates)
                    <th class="right" style="width: 9%;">{{ __('documents.tax') }}</th>
                @endif
                @if ($showAmounts)
                    <th class="right" style="width: 17%;">{{ __('documents.total_excl') }}</th>
                @endif
            </tr>
        </thead>
        <tbody>
            @foreach ($purchase->items as $item)
                <tr>
                    <td>
                        {{ $item->product_name }}
                        @if ($item->product_sku)
                            <div class="muted">{{ $item->product_sku }}</div>
                        @endif
                    </td>
                    <td class="right">{{ $item->quantity_ordered }}</td>
                    @if ($showUnitPrices)
                        <td class="right">{{ number_format($item->unit_price, 2, ',', ' ') }}</td>
                    @endif
                    @if ($hasDiscount)
                        <td class="right">{{ rtrim(rtrim(number_format($item->discount_rate, 2, ',', ' '), '0'), ',') }} %</td>
                    @endif
                    @if ($showRates)
                        <td class="right">{{ rtrim(rtrim(number_format($item->tax_rate, 2, ',', ' '), '0'), ',') }} %</td>
                    @endif
                    @if ($showAmounts)
                        <td class="right">{{ number_format($item->subtotal - $item->discount_amount, 2, ',', ' ') }}</td>
                    @endif
                </tr>
            @endforeach
        </tbody>
    </table>
@endsection

@section('totals')
    @if ($purchase->show_amounts ?? true)
    <table class="totals-wrap">
        <tr>
            <td style="width: 55%;"></td>
            <td style="width: 45%;">
                <table class="totals">
                    <tr>
                        <td>{{ __('documents.subtotal_excl') }}</td>
                        <td class="right amount">{{ number_format($purchase->subtotal, 2, ',', ' ') }} {{ $currencySymbol }}</td>
                    </tr>
                    @if ($purchase->discount_amount > 0)
                        <tr>
                            <td>{{ __('documents.discount') }}</td>
                            <td class="right amount">-{{ number_format($purchase->discount_amount, 2, ',', ' ') }} {{ $currencySymbol }}</td>
                        </tr>
                    @endif
                    <tr>
                        <td>{{ __('documents.tax') }}</td>
                        <td class="right amount">{{ number_format($purchase->tax_amount, 2, ',', ' ') }} {{ $currencySymbol }}</td>
                    </tr>
                    @if ($purchase->shipping_cost > 0)
                        <tr>
                            <td>{{ __('documents.shipping') }}</td>
                            <td class="right amount">{{ number_format($purchase->shipping_cost, 2, ',', ' ') }} {{ $currencySymbol }}</td>
                        </tr>
                    @endif
                    <tr class="grand">
                        <td>{{ __('documents.grand_total') }}</td>
                        <td class="right amount">{{ number_format($purchase->total, 2, ',', ' ') }} {{ $currencySymbol }}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
    @endif
@endsection

@section('notes')
    {{-- Les notes internes (internal_notes) restent dans l'application : ce document part chez le fournisseur. --}}
    @if ($purchase->notes)
        <div class="notes">
            <div class="bold">{{ __('documents.notes') }}</div>
            <div>{{ $purchase->notes }}</div>
        </div>
    @endif
@endsection
