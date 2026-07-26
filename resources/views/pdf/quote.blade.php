@extends('pdf.layouts.document')

@section('title', __('documents.quote'))
@section('number', $quote->quote_number)

@section('meta')
    <div class="muted">{{ __('documents.date') }} : {{ $quote->quote_date?->format('d/m/Y') }}</div>
    @if ($quote->expiry_date)
        <div class="muted">{{ __('documents.valid_until') }} : {{ $quote->expiry_date->format('d/m/Y') }}</div>
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
                <th style="width: 46%;">{{ __('documents.description') }}</th>
                <th class="right" style="width: 10%;">{{ __('documents.quantity') }}</th>
                <th class="right" style="width: 16%;">{{ __('documents.unit_price_excl') }}</th>
                <th class="right" style="width: 10%;">{{ __('documents.tax') }}</th>
                <th class="right" style="width: 18%;">{{ __('documents.total_excl') }}</th>
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
                    <th style="width: 25%;">{{ __('documents.rate') }}</th>
                    <th class="right" style="width: 40%;">{{ __('documents.base_excl') }}</th>
                    <th class="right" style="width: 35%;">{{ __('documents.tax') }}</th>
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

    {{-- Le bloc de totaux est isolé dans la colonne de droite d'un tableau porteur.
         Auparavant chaque ligne portait une cellule vide de 65 % : le trait du total
         général la traversait, et courait donc sur toute la largeur de la page. --}}
    <table class="totals-wrap">
        <tr>
            <td style="width: 55%;"></td>
            <td style="width: 45%;">
                <table class="totals">
                    <tr>
                        <td>{{ __('documents.subtotal_excl') }}</td>
                        <td class="right amount">{{ number_format($quote->subtotal, 2, ',', ' ') }} {{ $currencySymbol }}</td>
                    </tr>
                    <tr>
                        <td>{{ __('documents.tax') }}</td>
                        <td class="right amount">{{ number_format($quote->tax_amount, 2, ',', ' ') }} {{ $currencySymbol }}</td>
                    </tr>
                    <tr class="grand">
                        <td>{{ __('documents.grand_total') }}</td>
                        <td class="right amount">{{ number_format($quote->total, 2, ',', ' ') }} {{ $currencySymbol }}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
@endsection

@section('notes')
    @if ($quote->notes)
        <div class="notes">
            <div class="bold">{{ __('documents.notes') }}</div>
            <div>{{ $quote->notes }}</div>
        </div>
    @endif
    @if ($quote->terms)
        <div class="notes">
            <div class="bold">{{ __('documents.terms') }}</div>
            <div>{{ $quote->terms }}</div>
        </div>
    @endif
@endsection
