@extends('pdf.layouts.document')

@section('title', 'FACTURE')
@section('number', $invoice->invoice_number)

@section('meta')
    <div class="muted">Date : {{ $invoice->invoice_date?->format('d/m/Y') }}</div>
    @if ($invoice->due_date)
        <div class="muted">Échéance : {{ $invoice->due_date->format('d/m/Y') }}</div>
    @endif
    @if (in_array($invoice->status, ['paid', 'cancelled'], true))
        {{-- Une facture payée ou annulée doit se lire comme telle sur le papier :
             c'est ce qui circule, pas l'écran. --}}
        <div style="margin-top: 5pt;">
            <span class="badge">{{ $invoice->status === 'paid' ? 'PAYÉE' : 'ANNULÉE' }}</span>
        </div>
    @endif
@endsection

@section('party')
    <div class="bold">{{ $invoice->customer?->name }}</div>
    @if ($invoice->customer?->address)
        <div class="muted">{{ $invoice->customer->address }}</div>
    @endif
    @if ($invoice->customer?->phone)
        <div class="muted">Tél. {{ $invoice->customer->phone }}</div>
    @endif
    @if ($invoice->customer?->email)
        <div class="muted">{{ $invoice->customer->email }}</div>
    @endif
@endsection

@section('lines')
    <table class="lines">
        <thead>
            <tr>
                <th style="width: 46%;">Désignation</th>
                <th class="right" style="width: 10%;">Qté</th>
                <th class="right" style="width: 16%;">P.U. HT</th>
                <th class="right" style="width: 10%;">TVA</th>
                <th class="right" style="width: 18%;">Total TTC</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($invoice->items as $item)
                <tr>
                    <td>
                        {{ $item->product_name }}
                        @if ($item->description)
                            <div class="muted">{{ $item->description }}</div>
                        @endif
                    </td>
                    <td class="right">{{ $item->quantity }}</td>
                    <td class="right">{{ number_format($item->unit_price, 2, ',', ' ') }}</td>
                    <td class="right">{{ rtrim(rtrim(number_format($item->tax_rate, 2, ',', ' '), '0'), ',') }} %</td>
                    <td class="right">{{ number_format($item->total, 2, ',', ' ') }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
@endsection

@section('totals')
    {{-- Ventilation par taux : obligatoire dès que deux lignes n'ont pas le même taux, et
         c'est désormais le cas courant puisque le taux vient du produit. --}}
    @if (count($taxBreakdown) > 0)
        <table class="breakdown">
            <thead>
                <tr>
                    <th>Taux</th>
                    <th class="right">Base HT</th>
                    <th class="right">TVA</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($taxBreakdown as $band)
                    <tr>
                        <td>{{ rtrim(rtrim(number_format($band['rate'], 2, ',', ' '), '0'), ',') }} %</td>
                        <td class="right">{{ number_format($band['base'], 2, ',', ' ') }}</td>
                        <td class="right">{{ number_format($band['tax'], 2, ',', ' ') }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    <table class="totals">
        <tr>
            <td style="width: 65%;"></td>
            <td>Sous-total HT</td>
            <td class="right">{{ number_format($invoice->subtotal, 2, ',', ' ') }} {{ $currencySymbol }}</td>
        </tr>
        <tr>
            <td></td>
            <td>TVA</td>
            <td class="right">{{ number_format($invoice->tax_amount, 2, ',', ' ') }} {{ $currencySymbol }}</td>
        </tr>
        @if ($invoice->discount_amount > 0)
            <tr>
                <td></td>
                <td>Remise</td>
                <td class="right">-{{ number_format($invoice->discount_amount, 2, ',', ' ') }} {{ $currencySymbol }}</td>
            </tr>
        @endif
        <tr class="grand">
            <td></td>
            <td>TOTAL TTC</td>
            <td class="right">{{ number_format($invoice->total, 2, ',', ' ') }} {{ $currencySymbol }}</td>
        </tr>
    </table>
@endsection

@section('notes')
    @if ($invoice->notes)
        <div class="notes">
            <div class="bold">Notes</div>
            <div>{{ $invoice->notes }}</div>
        </div>
    @endif
@endsection
