@extends('pdf.layouts.document')

@section('title', 'DEVIS')
@section('number', $quote->quote_number)

@section('meta')
    <div class="muted">Date : {{ $quote->quote_date?->format('d/m/Y') }}</div>
    @if ($quote->expiry_date)
        <div class="muted">Valable jusqu'au : {{ $quote->expiry_date->format('d/m/Y') }}</div>
    @endif
@endsection

@section('party')
    <div class="bold">{{ $quote->customer?->name }}</div>
    @if ($quote->customer?->address)
        <div class="muted">{{ $quote->customer->address }}</div>
    @endif
    @if ($quote->customer?->phone)
        <div class="muted">Tél. {{ $quote->customer->phone }}</div>
    @endif
    @if ($quote->customer?->email)
        <div class="muted">{{ $quote->customer->email }}</div>
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
                <th class="right" style="width: 18%;">Total HT</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($quote->items as $item)
                <tr>
                    <td>
                        {{ $item->article_name ?: $item->product?->name }}
                        @if ($item->description)
                            <div class="muted">{{ $item->description }}</div>
                        @endif
                    </td>
                    <td class="right">{{ $item->quantity }}</td>
                    <td class="right">{{ number_format($item->unit_price, 2, ',', ' ') }}</td>
                    <td class="right">{{ rtrim(rtrim(number_format($item->tax_rate, 2, ',', ' '), '0'), ',') }} %</td>
                    <td class="right">{{ number_format($item->line_total, 2, ',', ' ') }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
@endsection

@section('totals')
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
            <td class="right">{{ number_format($quote->subtotal, 2, ',', ' ') }} {{ $currencySymbol }}</td>
        </tr>
        <tr>
            <td></td>
            <td>TVA</td>
            <td class="right">{{ number_format($quote->tax_amount, 2, ',', ' ') }} {{ $currencySymbol }}</td>
        </tr>
        <tr class="grand">
            <td></td>
            <td>TOTAL TTC</td>
            <td class="right">{{ number_format($quote->total, 2, ',', ' ') }} {{ $currencySymbol }}</td>
        </tr>
    </table>
@endsection

@section('notes')
    @if ($quote->notes)
        <div class="notes">
            <div class="bold">Notes</div>
            <div>{{ $quote->notes }}</div>
        </div>
    @endif
    @if ($quote->terms)
        <div class="notes">
            <div class="bold">Conditions</div>
            <div>{{ $quote->terms }}</div>
        </div>
    @endif
@endsection
