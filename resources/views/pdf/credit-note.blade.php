@extends('pdf.layouts.document')

@section('title', __('documents.credit_note'))
@section('number', $creditNote->credit_note_number)

@section('meta')
    <div class="muted">{{ __('documents.date') }} : {{ $creditNote->credit_note_date?->format('d/m/Y') }}</div>
    <div class="muted">{{ __('documents.credit_note_for') }} : {{ $creditNote->invoice?->invoice_number }}</div>
    @if ($creditNote->invoice?->fne_reference)
        <div class="muted">{{ __('documents.fne_number') }} : {{ $creditNote->invoice->fne_reference }}</div>
    @endif
@endsection

@section('party')
    <div class="bold">{{ $creditNote->customer?->name }}</div>
    @if ($creditNote->customer?->address)
        <div class="muted">{{ $creditNote->customer->address }}</div>
    @endif
    @if ($creditNote->customer?->phone)
        <div class="muted">Tél. {{ $creditNote->customer->phone }}</div>
    @endif
    @if ($creditNote->customer?->ncc)
        <div class="muted">{{ __('documents.ncc') }} : {{ $creditNote->customer->ncc }}</div>
    @endif
@endsection

@section('lines')
    <table class="lines">
        <thead>
            <tr>
                <th style="width: 50%;">{{ __('documents.description') }}</th>
                <th class="right" style="width: 10%;">{{ __('documents.quantity') }}</th>
                <th class="right" style="width: 16%;">{{ __('documents.unit_price_excl') }}</th>
                <th class="right" style="width: 8%;">{{ __('documents.tax') }}</th>
                <th class="right" style="width: 16%;">{{ __('documents.total_excl') }}</th>
            </tr>
        </thead>
        <tbody>
            {{-- CreditNoteItem.total est HT (voir CreditNote::calculateTotals), à la
                 différence d'une ligne de facture. --}}
            @foreach ($creditNote->items as $item)
                <tr>
                    <td>{{ $item->product_name }}</td>
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
    <table class="totals-wrap">
        <tr>
            <td style="width: 55%;"></td>
            <td style="width: 45%;">
                <table class="totals">
                    <tr>
                        <td>{{ __('documents.subtotal_excl') }}</td>
                        <td class="right amount">-{{ number_format($creditNote->subtotal, 2, ',', ' ') }} {{ $currencySymbol }}</td>
                    </tr>
                    <tr>
                        <td>{{ __('documents.tax') }}</td>
                        <td class="right amount">-{{ number_format($creditNote->tax_amount, 2, ',', ' ') }} {{ $currencySymbol }}</td>
                    </tr>
                    <tr class="grand">
                        <td>{{ __('documents.grand_total') }}</td>
                        <td class="right amount">-{{ number_format($creditNote->total, 2, ',', ' ') }} {{ $currencySymbol }}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
@endsection

@section('notes')
    <div class="notes">
        <div class="bold">{{ __('documents.reason') }}</div>
        <div>{{ $creditNote->reason }}</div>
        @if ($creditNote->notes)
            <div style="margin-top: 4pt;">{{ $creditNote->notes }}</div>
        @endif
    </div>
@endsection
